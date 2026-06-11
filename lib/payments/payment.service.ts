import { createActivityLog } from "@/lib/access-control"
import { AppError } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"
import {
  buildWaafiPayload,
  buildWaafiRequestId,
  getWaafiConfig,
  mapWaafiStatus,
  normalizeSomaliaPhoneNumber,
  sendWaafiPaymentRequest,
  validateWaafiConfig,
  type WaafiProvider,
} from "@/lib/payments/waafi.service"

async function activateSubscriptionAfterPayment(paymentId: string, actor?: { id?: string; name?: string | null; email?: string | null }) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { member: true, subscription: true, plan: true },
  })

  if (!payment?.subscriptionId || payment.status !== "PAID") return payment

  await prisma.subscription.update({
    where: { id: payment.subscriptionId },
    data: {
      status: "ACTIVE",
      paymentStatus: "PAID",
    },
  })

  await prisma.member.update({
    where: { id: payment.memberId },
    data: { status: "ACTIVE" },
  })

  await prisma.notification.create({
    data: {
      title: "Payment confirmed",
      message: `Your payment of ${payment.amount} ${payment.currency} has been confirmed.`,
      type: "UPGRADE_CONFIRMATION",
      target: "SINGLE_MEMBER",
      memberId: payment.memberId,
      readStatus: "UNREAD",
    },
  })

  await createActivityLog({
    type: "payments",
    activity: "Activated subscription after payment",
    subject: payment.member.fullName,
    subjectId: payment.id,
    userId: actor?.id,
    userDisplay: actor?.name || actor?.email || "System",
  })

  return payment
}

async function failWaafiPayment(
  paymentId: string,
  input: {
    memberId: string
    memberName: string
    reason: string
    rawResponse?: unknown
    actor?: { id?: string; name?: string | null; email?: string | null }
  },
) {
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "FAILED",
      failedReason: input.reason,
      rawResponse: input.rawResponse as never,
    },
  })

  await prisma.notification.create({
    data: {
      title: "Payment failed",
      message: "Your WaafiPay payment could not be completed. Please try again.",
      type: "PAYMENT_REMINDER",
      target: "SINGLE_MEMBER",
      memberId: input.memberId,
      readStatus: "UNREAD",
    },
  })

  await createActivityLog({
    type: "payments",
    activity: "WaafiPay payment failed",
    subject: input.memberName,
    subjectId: payment.id,
    userId: input.actor?.id,
    userDisplay: input.actor?.name || input.actor?.email || "System",
    metadata: { reason: input.reason },
  })

  return payment
}

export async function createManualPayment(input: {
  memberId: string
  subscriptionId?: string | null
  planId?: string | null
  amount: number
  currency?: string
  method: "CASH" | "MANUAL_EVC" | "EVC_MANUAL" | "BANK_TRANSFER" | "OTHER_MANUAL_MOBILE_MONEY"
  status: "PAID" | "PENDING" | "FAILED" | "CANCELLED" | "EXPIRED"
  paymentDate?: Date
  reference?: string | null
  notes?: string | null
  actor?: { id?: string; name?: string | null; email?: string | null }
}) {
  const payment = await prisma.payment.create({
    data: {
      memberId: input.memberId,
      subscriptionId: input.subscriptionId || null,
      planId: input.planId || null,
      amount: input.amount,
      currency: input.currency || "USD",
      paymentType: "MANUAL",
      method: input.method,
      status: input.status,
      paymentDate: input.paymentDate || new Date(),
      paidAt: input.status === "PAID" ? new Date() : null,
      reference: input.reference || null,
      referenceId: input.reference || null,
      notes: input.notes || null,
    },
  })

  if (payment.status === "PAID") {
    await activateSubscriptionAfterPayment(payment.id, input.actor)
  }

  return payment
}

export async function initiateWaafiPayment(input: {
  memberId: string
  subscriptionId: string
  planId: string
  amount: number
  currency: string
  provider: WaafiProvider
  phoneNumber: string
  actor?: { id?: string; name?: string | null; email?: string | null }
}) {
  if (input.amount < 0.01) {
    throw new AppError(400, "Amount must be at least 0.01")
  }

  const [member, subscription, plan, config] = await Promise.all([
    prisma.member.findUnique({ where: { id: input.memberId } }),
    prisma.subscription.findUnique({ where: { id: input.subscriptionId } }),
    prisma.membershipPlan.findUnique({ where: { id: input.planId } }),
    getWaafiConfig(),
  ])

  if (!member) throw new AppError(404, "Member not found")
  if (!subscription) throw new AppError(404, "Subscription not found")
  if (!plan) throw new AppError(404, "Plan not found")

  const requestId = buildWaafiRequestId()
  const referenceId = `SUB-${subscription.id}`
  const invoiceId = `INV-${requestId}`
  let phoneNumber = input.phoneNumber.replace(/\D/g, "")

  try {
    phoneNumber = normalizeSomaliaPhoneNumber(input.phoneNumber)
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Invalid Somalia mobile number"
    const payment = await prisma.payment.create({
      data: {
        memberId: member.id,
        subscriptionId: subscription.id,
        planId: plan.id,
        amount: input.amount,
        currency: input.currency,
        paymentType: "ONLINE",
        method: "WAAFI_PAY",
        onlineProvider: input.provider,
        provider: input.provider,
        phoneNumber,
        referenceId,
        invoiceId,
        requestId,
        status: "FAILED",
        failedReason: reason,
        rawResponse: { validationError: reason } as never,
        paymentDate: new Date(),
      },
    })

    await createActivityLog({
      type: "payments",
      activity: "WaafiPay payment failed validation",
      subject: member.fullName,
      subjectId: payment.id,
      userId: input.actor?.id,
      userDisplay: input.actor?.name || input.actor?.email || "System",
      metadata: { reason },
    })

    throw error
  }

  const payment = await prisma.payment.create({
    data: {
      memberId: member.id,
      subscriptionId: subscription.id,
      planId: plan.id,
      amount: input.amount,
      currency: input.currency,
      paymentType: "ONLINE",
      method: "WAAFI_PAY",
      onlineProvider: input.provider,
      provider: input.provider,
      phoneNumber,
      referenceId,
      invoiceId,
      requestId,
      status: "PENDING",
      paymentDate: new Date(),
    },
  })

  try {
    validateWaafiConfig(config)
  } catch (error) {
    const reason = error instanceof Error ? error.message : "WaafiPay is not configured"
    await failWaafiPayment(payment.id, {
      memberId: member.id,
      memberName: member.fullName,
      reason,
      rawResponse: { configurationError: reason },
      actor: input.actor,
    })
    throw error
  }

  const payload = buildWaafiPayload({
    merchantUid: config.waafiMerchantUid || "",
    apiUserId: config.waafiApiUserId || "",
    apiKey: config.waafiApiKey || "",
    phoneNumber,
    amount: input.amount,
    currency: input.currency,
    referenceId,
    invoiceId,
    requestId,
  })

  let waafiResponse: Awaited<ReturnType<typeof sendWaafiPaymentRequest>>
  try {
    waafiResponse = await sendWaafiPaymentRequest(payload, config.waafiApiBaseUrl || "")
  } catch (error) {
    const reason = error instanceof Error ? error.message : "WaafiPay request failed"
    await failWaafiPayment(payment.id, {
      memberId: member.id,
      memberName: member.fullName,
      reason,
      rawResponse: { requestError: reason },
      actor: input.actor,
    })
    throw new AppError(502, "WaafiPay request failed")
  }

  const status = waafiResponse.ok ? mapWaafiStatus(waafiResponse.body) : "FAILED"

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status,
      paidAt: status === "PAID" ? new Date() : null,
      failedReason: status === "FAILED" ? "WaafiPay request failed" : null,
      rawResponse: waafiResponse.body as never,
    },
  })

  if (status === "PAID") {
    await activateSubscriptionAfterPayment(updatedPayment.id, input.actor)
  } else if (status === "FAILED") {
    await prisma.notification.create({
      data: {
        title: "Payment failed",
        message: "Your WaafiPay payment could not be completed. Please try again.",
        type: "PAYMENT_REMINDER",
        target: "SINGLE_MEMBER",
        memberId: member.id,
        readStatus: "UNREAD",
      },
    })
  }

  await createActivityLog({
    type: "payments",
    activity: "Processed WaafiPay payment",
    subject: member.fullName,
    subjectId: updatedPayment.id,
    userId: input.actor?.id,
    userDisplay: input.actor?.name || input.actor?.email || "System",
    metadata: { provider: input.provider, status },
  })

  return updatedPayment
}

export async function refreshWaafiPaymentStatus(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
  if (!payment) throw new AppError(404, "Payment not found")
  return payment
}
