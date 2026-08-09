import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import { normalizeSubscriptionStatus, paginationMeta, requiredDate } from "@/lib/gym-api"
import { prisma } from "@/lib/prisma"
import { gymPaginationQuerySchema, subscriptionSchema } from "@/lib/validations/gym"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    await requirePermission("subscriptions.view")

    const { searchParams } = new URL(request.url)
    const { page, limit, search, status, memberId } = gymPaginationQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      memberId: searchParams.get("memberId") ?? undefined,
    })

    const where = {
      ...(status ? { status } : {}),
      ...(memberId ? { memberId } : {}),
      ...(search
        ? {
            OR: [
              { member: { fullName: { contains: search, mode: "insensitive" as const } } },
              { plan: { name: { contains: search, mode: "insensitive" as const } } },
            ],
        }
      : {}),
    } as never

    const [subscriptions, total, members, plans] = await Promise.all([
      prisma.subscription.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { member: true, plan: true, payments: { orderBy: { paymentDate: "desc" }, take: 3 } },
      }),
      prisma.subscription.count({ where }),
      prisma.member.findMany({ orderBy: { fullName: "asc" } }),
      prisma.membershipPlan.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    ])

    return { subscriptions, members, plans, pagination: paginationMeta(total, page, limit) }
  }, { path: "/api/v1/subscriptions", method: "GET" })
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requirePermission("subscriptions.create")
    const payload = subscriptionSchema.parse(await request.json())
    const status = normalizeSubscriptionStatus(payload)

    const subscription = await prisma.subscription.create({
      data: {
        memberId: payload.memberId,
        planId: payload.planId,
        startDate: requiredDate(payload.startDate),
        expiryDate: requiredDate(payload.expiryDate),
        status,
        paymentStatus: payload.paymentStatus,
      },
      include: { member: true, plan: true },
    })

    await createActivityLog({
      type: "subscriptions",
      activity: "Assigned subscription",
      subject: `${subscription.member.fullName} - ${subscription.plan.name}`,
      subjectId: subscription.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
    })

    return { subscription, message: "Subscription created successfully" }
  }, { path: "/api/v1/subscriptions", method: "POST" })
}
