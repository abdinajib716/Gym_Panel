import { NextRequest } from "next/server"

import { requirePermission } from "@/lib/auth"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { createManualPayment } from "@/lib/payments/payment.service"
import { paymentSchema } from "@/lib/validations/gym"

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requirePermission("payments.manual_create")
    const payload = paymentSchema.parse(await request.json())
    if (payload.method === "WAAFI" || payload.method === "WAAFI_PAY" || payload.method === "EVC_ONLINE") {
      throw new AppError(400, "Manual payment route only accepts manual payment methods")
    }
    const manualMethod = payload.method === "EVC_MANUAL" ? "MANUAL_EVC" : payload.method
    const payment = await createManualPayment({
      memberId: payload.memberId,
      subscriptionId: payload.subscriptionId || null,
      planId: payload.planId || null,
      amount: Number(payload.amount),
      currency: payload.currency || "USD",
      method: manualMethod,
      status: payload.status,
      paymentDate: new Date(payload.paymentDate),
      reference: payload.reference || null,
      notes: payload.notes || null,
      actor: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    })

    return { payment, message: "Manual payment created successfully" }
  }, { path: "/api/v1/payments/manual", method: "POST" })
}
