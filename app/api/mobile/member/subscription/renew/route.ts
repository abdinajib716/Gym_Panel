import { NextRequest } from "next/server"

import { AppError, withErrorHandling } from "@/lib/error-handler"
import { createPendingSubscription, requireMobileMember, safeSubscription } from "@/lib/mobile-member"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileMember(request)
    const payload = (await request.json().catch(() => ({}))) as { planId?: string }

    const latestSubscription = await prisma.subscription.findFirst({
      where: { memberId: account.memberId },
      include: { plan: true },
      orderBy: { expiryDate: "desc" },
    })

    const planId = payload.planId || latestSubscription?.planId
    if (!planId) throw new AppError(400, "Plan is required")

    const now = new Date()
    const startDate = latestSubscription && latestSubscription.expiryDate > now
      ? new Date(latestSubscription.expiryDate.getTime() + 24 * 60 * 60 * 1000)
      : now

    const subscription = await createPendingSubscription({
      memberId: account.memberId,
      planId,
      startDate,
    })

    return {
      success: true,
      message: "Renewal request created. Complete payment to activate the subscription.",
      subscription: safeSubscription(subscription),
      paymentRequired: true,
    }
  }, { path: "/api/mobile/member/subscription/renew", method: "POST" })
}
