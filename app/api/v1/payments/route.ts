import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { emptyToNull, paginationMeta, requiredDate, syncSubscriptionAfterPayment } from "@/lib/gym-api"
import { withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"
import { gymPaginationQuerySchema, paymentSchema } from "@/lib/validations/gym"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    await requirePermission("payments.view")

    const { searchParams } = new URL(request.url)
    const { page, limit, search, status, method, memberId } = gymPaginationQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      method: searchParams.get("method") ?? undefined,
      memberId: searchParams.get("memberId") ?? undefined,
    })

    const where = {
      ...(status ? { status } : {}),
      ...(method ? { method } : {}),
      ...(memberId ? { memberId } : {}),
      ...(search
        ? {
            OR: [
              { member: { fullName: { contains: search, mode: "insensitive" as const } } },
              { reference: { contains: search, mode: "insensitive" as const } },
              { referenceId: { contains: search, mode: "insensitive" as const } },
              { invoiceId: { contains: search, mode: "insensitive" as const } },
              { requestId: { contains: search, mode: "insensitive" as const } },
              { transactionId: { contains: search, mode: "insensitive" as const } },
              { failedReason: { contains: search, mode: "insensitive" as const } },
            ],
        }
      : {}),
    } as never

    const [payments, total, members, subscriptions, plans] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { paymentDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { member: true, subscription: { include: { plan: true } }, plan: true },
      }),
      prisma.payment.count({ where }),
      prisma.member.findMany({ orderBy: { fullName: "asc" } }),
      prisma.subscription.findMany({ include: { member: true, plan: true }, orderBy: { createdAt: "desc" } }),
      prisma.membershipPlan.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    ])

    return { payments, members, subscriptions, plans, pagination: paginationMeta(total, page, limit) }
  }, { path: "/api/v1/payments", method: "GET" })
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requirePermission("payments.create")
    const payload = paymentSchema.parse(await request.json())

    const payment = await prisma.payment.create({
      data: {
        memberId: payload.memberId,
        subscriptionId: emptyToNull(payload.subscriptionId),
        planId: emptyToNull(payload.planId),
        amount: payload.amount,
        method: payload.method,
        status: payload.status,
        paymentDate: requiredDate(payload.paymentDate),
        reference: emptyToNull(payload.reference),
        notes: emptyToNull(payload.notes),
        transactionId: emptyToNull(payload.transactionId),
        provider: emptyToNull(payload.provider),
      },
      include: { member: true, subscription: true, plan: true },
    })

    await syncSubscriptionAfterPayment({
      subscriptionId: payment.subscriptionId,
      memberId: payment.memberId,
      status: payment.status,
    })

    await createActivityLog({
      type: "payments",
      activity: payment.status === "PAID" ? "Confirmed payment" : "Created payment",
      subject: payment.member.fullName,
      subjectId: payment.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
      metadata: { amount: payment.amount, status: payment.status, method: payment.method },
    })

    return { payment, message: "Payment created successfully" }
  }, { path: "/api/v1/payments", method: "POST" })
}
