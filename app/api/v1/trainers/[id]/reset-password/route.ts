import { NextRequest } from "next/server"
import { requirePermission } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import { resetTrainerTemporaryPassword } from "@/lib/mobile-credentials"

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await requirePermission("trainers.update")
    const { id } = await params
    const result = await resetTrainerTemporaryPassword(id, { id: session.user.id, name: session.user.name, email: session.user.email })
    return { ...result, message: result.emailStatus === "sent" ? "Password reset and login details emailed" : "Password reset. Copy the temporary password from trainer details." }
  }, { path: "/api/v1/trainers/[id]/reset-password", method: "POST" })
}
