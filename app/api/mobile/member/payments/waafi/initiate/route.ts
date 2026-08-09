import { NextRequest } from "next/server"

import { AppError, withErrorHandling } from "@/lib/error-handler"
import { findMemberSubscription, requireMobileMember, safePayment, toNumber } from "@/lib/mobile-member"
import { initiateWaafiPayment } from "@/lib/payments/payment.service"

const providers = ["EVC_PLUS", "JEEB", "ZAAD", "SAHAL"] as const

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileMember(request)
    const payload = (await request.json().catch(() => ({}))) as {
      subscriptionId?: string
      provider?: typeof providers[number]
      phoneNumber?: string
      amount?: number | string
      currency?: string
    }

    if (!payload.subscriptionId) throw new AppError(400, "Subscription is required")
    if (!payload.phoneNumber) throw new AppError(400, "Phone number is required")
    if (!payload.provider || !providers.includes(payload.provider)) throw new AppError(400, "Waafi provider is required")

    const subscription = await findMemberSubscription(account.memberId, payload.subscriptionId)
    const amount = payload.amount === undefined || payload.amount === "" ? toNumber(subscription.plan.price) : Number(payload.amount)
    if (!Number.isFinite(amount) || amount < 0.01) throw new AppError(400, "Amount must be at least 0.01")

    const payment = await initiateWaafiPayment({
      memberId: account.memberId,
      subscriptionId: subscription.id,
      planId: subscription.planId,
      amount,
      currency: payload.currency || "USD",
      provider: payload.provider,
      phoneNumber: payload.phoneNumber,
      actor: {
        name: account.member.fullName,
        email: account.loginEmail,
      },
    })

    return {
      success: true,
      payment: safePayment({ ...payment, plan: subscription.plan, subscription }),
    }
  }, { path: "/api/mobile/member/payments/waafi/initiate", method: "POST" })
}
