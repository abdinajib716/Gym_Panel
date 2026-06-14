import { NextRequest } from "next/server"

import { AppError, withErrorHandling } from "@/lib/error-handler"
import { requireMobileMember, safePayment } from "@/lib/mobile-member"
import { refreshWaafiPaymentStatus } from "@/lib/payments/payment.service"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: Promise<{ paymentId: string }> }) {
  return withErrorHandling(async () => {
    const account = await requireMobileMember(request)
    const { paymentId } = await params

    const existing = await prisma.payment.findFirst({
      where: { id: paymentId, memberId: account.memberId },
    })
    if (!existing) throw new AppError(404, "Payment not found")

    await refreshWaafiPaymentStatus(paymentId)
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { plan: true, subscription: { include: { plan: true } } },
    })
    if (!payment) throw new AppError(404, "Payment not found")

    return {
      success: true,
      payment: safePayment(payment),
    }
  }, { path: "/api/mobile/member/payments/waafi/status/[paymentId]", method: "GET" })
}
