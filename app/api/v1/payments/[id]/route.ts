import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { emptyToNull, requiredDate, syncSubscriptionAfterPayment } from "@/lib/gym-api"
import { prisma } from "@/lib/prisma"
import { paymentUpdateSchema } from "@/lib/validations/gym"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    await requirePermission("payments.view")
    const { id } = await params

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { member: true, subscription: { include: { plan: true } }, plan: true },
    })

    if (!payment) {
      throw new AppError(404, "Payment not found")
    }

    return { payment }
  }, { path: "/api/v1/payments/[id]", method: "GET" })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await requirePermission("payments.update")
    const { id } = await params
    const payload = paymentUpdateSchema.parse(await request.json())

    const existingPayment = await prisma.payment.findUnique({ where: { id } })
    if (!existingPayment) {
      throw new AppError(404, "Payment not found")
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        ...(payload.memberId !== undefined ? { memberId: payload.memberId } : {}),
        ...(payload.subscriptionId !== undefined ? { subscriptionId: emptyToNull(payload.subscriptionId) } : {}),
        ...(payload.planId !== undefined ? { planId: emptyToNull(payload.planId) } : {}),
        ...(payload.amount !== undefined ? { amount: payload.amount } : {}),
        ...(payload.method !== undefined ? { method: payload.method } : {}),
        ...(payload.status !== undefined ? { status: payload.status } : {}),
        ...(payload.paymentDate !== undefined ? { paymentDate: requiredDate(payload.paymentDate) } : {}),
        ...(payload.reference !== undefined ? { reference: emptyToNull(payload.reference) } : {}),
        ...(payload.notes !== undefined ? { notes: emptyToNull(payload.notes) } : {}),
        ...(payload.transactionId !== undefined ? { transactionId: emptyToNull(payload.transactionId) } : {}),
        ...(payload.provider !== undefined ? { provider: emptyToNull(payload.provider) } : {}),
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
      activity: payment.status === "PAID" ? "Confirmed payment" : "Updated payment",
      subject: payment.member.fullName,
      subjectId: payment.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
      metadata: { amount: payment.amount, status: payment.status, method: payment.method },
    })

    return { payment, message: "Payment updated successfully" }
  }, { path: "/api/v1/payments/[id]", method: "PUT" })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await requirePermission("payments.delete")
    const { id } = await params

    const existingPayment = await prisma.payment.findUnique({
      where: { id },
      include: { member: true },
    })
    if (!existingPayment) {
      throw new AppError(404, "Payment not found")
    }

    await prisma.payment.delete({ where: { id } })

    await createActivityLog({
      type: "payments",
      activity: "Deleted payment",
      subject: existingPayment.member.fullName,
      subjectId: existingPayment.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
    })

    return { success: true, message: "Payment deleted successfully" }
  }, { path: "/api/v1/payments/[id]", method: "DELETE" })
}
