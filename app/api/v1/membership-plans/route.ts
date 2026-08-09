import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import { emptyToNull, paginationMeta } from "@/lib/gym-api"
import { prisma } from "@/lib/prisma"
import { gymPaginationQuerySchema, membershipPlanSchema } from "@/lib/validations/gym"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    await requirePermission("plans.view")

    const { searchParams } = new URL(request.url)
    const { page, limit, search, status, type } = gymPaginationQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      type: searchParams.get("type") ?? undefined,
    })

    const where = {
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    } as never

    const [plans, total] = await Promise.all([
      prisma.membershipPlan.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { subscriptions: true } } },
      }),
      prisma.membershipPlan.count({ where }),
    ])

    return { plans, pagination: paginationMeta(total, page, limit) }
  }, { path: "/api/v1/membership-plans", method: "GET" })
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requirePermission("plans.create")
    const payload = membershipPlanSchema.parse(await request.json())

    const plan = await prisma.membershipPlan.create({
      data: {
        name: payload.name,
        type: payload.type,
        durationDays: payload.durationDays,
        price: payload.price,
        description: emptyToNull(payload.description),
        status: payload.status,
      },
    })

    await createActivityLog({
      type: "plans",
      activity: "Created membership plan",
      subject: plan.name,
      subjectId: plan.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
    })

    return { plan, message: "Membership plan created successfully" }
  }, { path: "/api/v1/membership-plans", method: "POST" })
}
