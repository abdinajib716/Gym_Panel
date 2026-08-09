import crypto from "node:crypto"

import bcrypt from "bcryptjs"
import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { adminPasswordResetEmail } from "@/lib/email/templates"
import { sendConfiguredEmail } from "@/lib/email/email.service"
import { prisma } from "@/lib/prisma"

const RESET_EXPIRES_MINUTES = 15

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const payload = (await request.json().catch(() => ({}))) as { email?: string }
    const email = payload.email?.trim().toLowerCase()

    if (!email) {
      throw new AppError(400, "Email is required")
    }

    const user = await prisma.accessUser.findUnique({ where: { email } })
    if (!user) {
      return { message: "If that email exists, a reset code has been sent." }
    }

    const settings = await prisma.accessControlSettings.findUnique({ where: { key: "global" } })
    const code = String(crypto.randomInt(100000, 999999))
    const codeHash = await bcrypt.hash(code, 10)
    const expiresAt = new Date(Date.now() + RESET_EXPIRES_MINUTES * 60 * 1000)

    await prisma.accessPasswordReset.create({
      data: {
        userId: user.id,
        codeHash,
        expiresAt,
      },
    })

    const template = adminPasswordResetEmail({
      gymName: settings?.siteName || "Gym Management Admin",
      name: user.displayName || `${user.firstName} ${user.lastName}`.trim() || user.email,
      code,
      expiresMinutes: RESET_EXPIRES_MINUTES,
    })

    await sendConfiguredEmail({ to: user.email, ...template })

    await createActivityLog({
      type: "auth",
      activity: "Requested admin password reset",
      subject: user.email,
      subjectId: user.id,
      userDisplay: user.email,
    })

    return { message: "If that email exists, a reset code has been sent." }
  }, { path: "/api/auth/forgot-password", method: "POST" })
}
