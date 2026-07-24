import { NextRequest } from "next/server"

import { AppError } from "@/lib/error-handler"
import { requireMobileAccount } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"

type MemberAccount = Awaited<ReturnType<typeof requireMobileAccount>>

export async function requireMobileMember(request: NextRequest) {
  const account = await requireMobileAccount(request)
  if (account.role !== "MEMBER" || !account.memberId || !account.member) {
    throw new AppError(403, "Member access required")
  }
  return account as MemberAccount & { memberId: string; member: NonNullable<MemberAccount["member"]> }
}

export function toNumber(value: unknown) {
  if (value === null || value === undefined) return 0
  return Number(value)
}

export function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function safePlan(plan: {
  id: string
  name: string
  type: string
  durationDays: number
  price: unknown
  description?: string | null
  status: string
}) {
  return {
    id: plan.id,
    name: plan.name,
    type: plan.type,
    durationDays: plan.durationDays,
    price: toNumber(plan.price),
    currency: "USD",
    description: plan.description,
    status: plan.status,
  }
}

export function safeSubscription(subscription: {
  id: string
  startDate: Date
  expiryDate: Date
  status: string
  paymentStatus: string
  createdAt: Date
  plan: Parameters<typeof safePlan>[0]
}) {
  return {
    id: subscription.id,
    plan: safePlan(subscription.plan),
    startDate: subscription.startDate,
    expiryDate: subscription.expiryDate,
    status: subscription.status,
    paymentStatus: subscription.paymentStatus,
    createdAt: subscription.createdAt,
  }
}

export function safePayment(payment: {
  id: string
  amount: unknown
  currency: string
  paymentType: string
  method: string
  onlineProvider?: string | null
  status: string
  paymentDate: Date
  paidAt?: Date | null
  reference?: string | null
  referenceId?: string | null
  invoiceId?: string | null
  requestId?: string | null
  transactionId?: string | null
  phoneNumber?: string | null
  failedReason?: string | null
  rawResponse?: unknown
  plan?: Parameters<typeof safePlan>[0] | null
  subscription?: { id: string; plan?: Parameters<typeof safePlan>[0] | null } | null
}) {
  const raw = payment.rawResponse && typeof payment.rawResponse === "object" ? payment.rawResponse as Record<string, unknown> : null
  return {
    id: payment.id,
    amount: toNumber(payment.amount),
    currency: payment.currency,
    paymentType: payment.paymentType,
    method: payment.method,
    provider: payment.onlineProvider,
    status: payment.status,
    paymentDate: payment.paymentDate,
    paidAt: payment.paidAt,
    reference: payment.reference,
    referenceId: payment.referenceId,
    invoiceId: payment.invoiceId,
    requestId: payment.requestId,
    transactionId: payment.transactionId,
    phoneNumber: payment.phoneNumber,
    failedReason: payment.failedReason,
    responseMessage: raw?.responseMessage ?? null,
    orderId: raw?.orderId ?? null,
    plan: payment.plan ? safePlan(payment.plan) : payment.subscription?.plan ? safePlan(payment.subscription.plan) : null,
    subscriptionId: payment.subscription?.id ?? null,
    rawResponse: payment.rawResponse ?? null,
  }
}

export function safeNotification(notification: {
  id: string
  title: string
  message: string
  type: string
  readStatus: string
  createdAt: Date
}) {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    readStatus: notification.readStatus,
    createdAt: notification.createdAt,
  }
}

export function safeAttendance(attendance: {
  id: string
  memberId: string
  checkInDate: Date
  method: string
  status: string
  createdAt: Date
}) {
  return {
    id: attendance.id,
    memberId: attendance.memberId,
    checkInDate: attendance.checkInDate,
    method: attendance.method,
    status: attendance.status,
    createdAt: attendance.createdAt,
  }
}

export async function findMemberSubscription(memberId: string, subscriptionId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: { id: subscriptionId, memberId },
    include: { plan: true },
  })
  if (!subscription) throw new AppError(404, "Subscription not found")
  return subscription
}

export async function createPendingSubscription(input: {
  memberId: string
  planId: string
  startDate?: Date
}) {
  const plan = await prisma.membershipPlan.findFirst({
    where: { id: input.planId, status: "ACTIVE" },
  })
  if (!plan) throw new AppError(404, "Membership plan not found")

  const startDate = input.startDate || new Date()
  const expiryDate = addDays(startDate, plan.durationDays)

  const subscription = await prisma.subscription.create({
    data: {
      memberId: input.memberId,
      planId: plan.id,
      startDate,
      expiryDate,
      status: "PENDING",
      paymentStatus: "PENDING",
    },
    include: { plan: true },
  })

  return subscription
}
