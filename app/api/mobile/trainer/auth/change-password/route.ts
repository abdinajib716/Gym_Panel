import bcrypt from "bcryptjs"
import { NextRequest } from "next/server"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { resetMobilePassword } from "@/lib/mobile-auth"
import { requireMobileTrainer } from "@/lib/mobile-trainer"

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const payload = await request.json().catch(() => ({})) as { currentPassword?: string; current_password?: string; newPassword?: string; new_password?: string }
    const currentPassword = payload.currentPassword || payload.current_password || ""
    const newPassword = payload.newPassword || payload.new_password || ""
    if (!(await bcrypt.compare(currentPassword, account.passwordHash))) throw new AppError(400, "Current password is incorrect")
    if (newPassword.length < 8) throw new AppError(400, "Password must be at least 8 characters")
    await resetMobilePassword(account.id, newPassword)
    return { success: true, message: "Password changed successfully" }
  }, { path: "/api/mobile/trainer/auth/change-password", method: "POST" })
}
