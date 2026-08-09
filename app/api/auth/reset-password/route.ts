import bcrypt from "bcryptjs"
import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const payload = (await request.json().catch(() => ({}))) as {
      email?: string
      code?: string
      password?: string
    }
    const email = payload.email?.trim().toLowerCase()
    const code = payload.code?.trim()
    const password = payload.password || ""

    if (!email || !code || !password) {
      throw new AppError(400, "Email, reset code, and new password are required")
    }

    if (password.length < 8) {
      throw new AppError(400, "Password must be at least 8 characters")
    }

    const user = await prisma.accessUser.findUnique({ where: { email } })
    if (!user) throw new AppError(400, "Invalid or expired reset code")

    const reset = await prisma.accessPasswordReset.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    })

    if (!reset) throw new AppError(400, "Invalid or expired reset code")

    const codeMatches = await bcrypt.compare(code, reset.codeHash)
    if (!codeMatches) throw new AppError(400, "Invalid or expired reset code")

    const passwordHash = await bcrypt.hash(password, 10)

    await prisma.$transaction([
      prisma.accessUser.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.accessPasswordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
      prisma.accessPasswordReset.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
          id: { not: reset.id },
        },
        data: { usedAt: new Date() },
      }),
    ])

    await createActivityLog({
      type: "auth",
      activity: "Reset admin password",
      subject: user.email,
      subjectId: user.id,
      userDisplay: user.email,
    })

    return { message: "Password reset successfully. You can now sign in." }
  }, { path: "/api/auth/reset-password", method: "POST" })
}
