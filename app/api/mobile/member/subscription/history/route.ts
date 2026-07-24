import { NextRequest } from "next/server"

import { AppError, withErrorHandling } from "@/lib/error-handler"
import { requireMobileMember, safeSubscription } from "@/lib/mobile-member"
import { prisma } from "@/lib/prisma"

const subscriptionStatuses = ["ACTIVE", "EXPIRED", "PENDING", "SUSPENDED"]
const paymentStatuses = ["PAID", "PENDING", "FAILED", "CANCELLED", "EXPIRED"]

function subscriptionDateRange(period?: string | null, dateFrom?: string | null, dateTo?: string | null) {
  if (dateFrom || dateTo) {
    return {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    }
  }

  if (!period) return undefined

  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  if (period === "today") {
    return { gte: start, lte: end }
  }
  if (period === "week") {
    start.setDate(start.getDate() - 6)
    return { gte: start, lte: end }
  }
  if (period === "month") {
    start.setDate(1)
    return { gte: start, lte: end }
  }
  if (period === "year") {
    start.setMonth(0, 1)
    return { gte: start, lte: end }
  }

  return undefined
}

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileMember(request)
    const params = new URL(request.url).searchParams
    const status = params.get("status")
    const paymentStatus = params.get("paymentStatus") || params.get("payment_status")
    const planId = params.get("planId") || params.get("plan_id")
    const period = params.get("period")
    const dateFrom = params.get("dateFrom") || params.get("date_from")
    const dateTo = params.get("dateTo") || params.get("date_to")
    const dateRange = subscriptionDateRange(period, dateFrom, dateTo)

    if (status && !subscriptionStatuses.includes(status)) throw new AppError(400, "Subscription status filter is invalid")
    if (paymentStatus && !paymentStatuses.includes(paymentStatus)) throw new AppError(400, "Payment status filter is invalid")

    const subscriptions = await prisma.subscription.findMany({
      where: {
        memberId: account.memberId,
        ...(status ? { status } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
        ...(planId ? { planId } : {}),
        ...(dateRange ? { createdAt: dateRange } : {}),
      } as never,
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    })

    return {
      success: true,
      filters: {
        status,
        paymentStatus,
        planId,
        period,
        dateFrom,
        dateTo,
      },
      subscriptions: subscriptions.map(safeSubscription),
    }
  }, { path: "/api/mobile/member/subscription/history", method: "GET" })
}
