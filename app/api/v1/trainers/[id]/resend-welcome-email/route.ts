import { NextRequest } from "next/server"

import { requirePermission } from "@/lib/auth"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { sendTrainerWelcomeEmail } from "@/lib/mobile-credentials"

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await requirePermission("trainer_credentials.resend_email")
    const { id } = await params
    const status = await sendTrainerWelcomeEmail(id, {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    })

    if (status === "missing_email") {
      throw new AppError(400, "Trainer has no email address. Login details are available in View Details.")
    }

    if (status === "failed") {
      throw new AppError(502, "Welcome email failed. Login details are available in View Details.")
    }

    return { status, message: "Trainer welcome email sent successfully" }
  }, { path: "/api/v1/trainers/[id]/resend-welcome-email", method: "POST" })
}
