import { NextRequest } from "next/server"

import { AppError, withErrorHandling } from "@/lib/error-handler"
import { createPendingSubscription, requireMobileMember, safeSubscription } from "@/lib/mobile-member"

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileMember(request)
    const payload = (await request.json().catch(() => ({}))) as { planId?: string; startDate?: string }
    if (!payload.planId) throw new AppError(400, "Plan is required")

    const startDate = payload.startDate ? new Date(payload.startDate) : new Date()
    if (Number.isNaN(startDate.getTime())) throw new AppError(400, "Start date is invalid")

    const subscription = await createPendingSubscription({
      memberId: account.memberId,
      planId: payload.planId,
      startDate,
    })

    return {
      success: true,
      message: "Upgrade request created. Complete payment to activate the subscription.",
      subscription: safeSubscription(subscription),
      paymentRequired: true,
    }
  }, { path: "/api/mobile/member/subscription/upgrade", method: "POST" })
}
