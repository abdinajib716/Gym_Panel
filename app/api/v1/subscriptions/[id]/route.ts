import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { normalizeSubscriptionStatus, requiredDate } from "@/lib/gym-api"
import { prisma } from "@/lib/prisma"
import { subscriptionUpdateSchema } from "@/lib/validations/gym"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    await requirePermission("subscriptions.view")
    const { id } = await params

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: { member: true, plan: true, payments: { orderBy: { paymentDate: "desc" } } },
    })

    if (!subscription) {
      throw new AppError(404, "Subscription not found")
    }

    return { subscription }
  }, { path: "/api/v1/subscriptions/[id]", method: "GET" })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await requirePermission("subscriptions.update")
    const { id } = await params
    const payload = subscriptionUpdateSchema.parse(await request.json())

    const existingSubscription = await prisma.subscription.findUnique({
      where: { id },
      include: { member: true, plan: true },
    })
    if (!existingSubscription) {
      throw new AppError(404, "Subscription not found")
    }

    const nextPaymentStatus = payload.paymentStatus ?? existingSubscription.paymentStatus
    const nextStatus = normalizeSubscriptionStatus({
      status: payload.status ?? existingSubscription.status,
      paymentStatus: nextPaymentStatus,
    })

    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        ...(payload.memberId !== undefined ? { memberId: payload.memberId } : {}),
        ...(payload.planId !== undefined ? { planId: payload.planId } : {}),
        ...(payload.startDate !== undefined ? { startDate: requiredDate(payload.startDate) } : {}),
        ...(payload.expiryDate !== undefined ? { expiryDate: requiredDate(payload.expiryDate) } : {}),
        status: nextStatus,
        paymentStatus: nextPaymentStatus,
      },
      include: { member: true, plan: true },
    })

    await createActivityLog({
      type: "subscriptions",
      activity: nextStatus === "SUSPENDED" ? "Suspended subscription" : nextStatus === "ACTIVE" ? "Renewed subscription" : "Updated subscription",
      subject: `${subscription.member.fullName} - ${subscription.plan.name}`,
      subjectId: subscription.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
    })

    return { subscription, message: "Subscription updated successfully" }
  }, { path: "/api/v1/subscriptions/[id]", method: "PUT" })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await requirePermission("subscriptions.delete")
    const { id } = await params

    const existingSubscription = await prisma.subscription.findUnique({
      where: { id },
      include: { member: true, plan: true },
    })
    if (!existingSubscription) {
      throw new AppError(404, "Subscription not found")
    }

    await prisma.subscription.delete({ where: { id } })

    await createActivityLog({
      type: "subscriptions",
      activity: "Deleted subscription",
      subject: `${existingSubscription.member.fullName} - ${existingSubscription.plan.name}`,
      subjectId: existingSubscription.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
    })

    return { success: true, message: "Subscription deleted successfully" }
  }, { path: "/api/v1/subscriptions/[id]", method: "DELETE" })
}
