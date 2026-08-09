import bcrypt from "bcryptjs"
import { NextRequest } from "next/server"

import { AppError, withErrorHandling } from "@/lib/error-handler"
import { findMobileAccount, resetMobilePassword } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const payload = (await request.json().catch(() => ({}))) as {
      identifier?: string
      email?: string
      Email?: string
      code?: string
      newPassword?: string
    }
    const identifier = payload.identifier || payload.email || payload.Email || ""
    const code = payload.code?.trim()
    const newPassword = payload.newPassword || ""

    if (!identifier || !code || !newPassword) {
      throw new AppError(400, "Identifier, code, and new password are required")
    }

    if (newPassword.length < 8) {
      throw new AppError(400, "Password must be at least 8 characters")
    }

    const account = await findMobileAccount(identifier)
    if (!account) throw new AppError(400, "Invalid or expired reset code")

    const reset = await prisma.mobilePasswordReset.findFirst({
      where: {
        accountId: account.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    })

    if (!reset) throw new AppError(400, "Invalid or expired reset code")

    const matches = await bcrypt.compare(code, reset.codeHash)
    if (!matches) throw new AppError(400, "Invalid or expired reset code")

    await prisma.$transaction([
      prisma.mobilePasswordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
      prisma.mobilePasswordReset.updateMany({
        where: { accountId: account.id, usedAt: null, id: { not: reset.id } },
        data: { usedAt: new Date() },
      }),
    ])

    await resetMobilePassword(account.id, newPassword)

    return { success: true, message: "Password reset successfully. You can now log in." }
  }, { path: "/api/mobile/auth/reset-password", method: "POST" })
}
