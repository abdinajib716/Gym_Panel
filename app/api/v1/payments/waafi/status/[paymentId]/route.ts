import { NextRequest } from "next/server"

import { requirePermission } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import { refreshWaafiPaymentStatus } from "@/lib/payments/payment.service"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ paymentId: string }> }) {
  return withErrorHandling(async () => {
    await requirePermission("payments.status_check")
    const { paymentId } = await params
    const payment = await refreshWaafiPaymentStatus(paymentId)
    return { payment }
  }, { path: "/api/v1/payments/waafi/status/[paymentId]", method: "GET" })
}
