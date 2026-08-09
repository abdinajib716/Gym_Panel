import { NextRequest } from "next/server"

import { requirePermission } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import { initiateWaafiPayment } from "@/lib/payments/payment.service"
import { waafiInitiatePaymentSchema } from "@/lib/validations/gym"

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requirePermission("payments.online_process")
    const payload = waafiInitiatePaymentSchema.parse(await request.json())
    const payment = await initiateWaafiPayment({
      ...payload,
      actor: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    })

    return {
      payment,
      message:
        payment.status === "PENDING"
          ? "Check your phone. A payment request has been sent. Enter your PIN to confirm the payment."
          : "WaafiPay payment processed",
    }
  }, { path: "/api/v1/payments/waafi/initiate", method: "POST" })
}
