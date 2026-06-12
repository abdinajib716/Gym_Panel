import crypto from "node:crypto"

import bcrypt from "bcryptjs"
import { NextRequest } from "next/server"

import { withErrorHandling } from "@/lib/error-handler"
import { sendConfiguredEmail } from "@/lib/email/email.service"
import { findMobileAccount } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"

const RESET_EXPIRES_MINUTES = 15

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const payload = (await request.json().catch(() => ({}))) as {
      email?: string
      Email?: string
      identifier?: string
    }
    const identifier = payload.identifier || payload.email || payload.Email || ""
    const account = await findMobileAccount(identifier)

    if (account?.loginEmail) {
      const settings = await prisma.accessControlSettings.findUnique({ where: { key: "global" } })
      const code = String(crypto.randomInt(100000, 999999))
      const codeHash = await bcrypt.hash(code, 10)
      await prisma.mobilePasswordReset.create({
        data: {
          accountId: account.id,
          codeHash,
          expiresAt: new Date(Date.now() + RESET_EXPIRES_MINUTES * 60 * 1000),
        },
      })

      await sendConfiguredEmail({
        to: account.loginEmail,
        subject: `${settings?.siteName || "Gym"} - Mobile Password Reset Code`,
        text: `Hello,

Your mobile app password reset code is:

${code}

This code expires in ${RESET_EXPIRES_MINUTES} minutes.`,
      })
    }

    return { success: true, message: "If that account exists, a reset code has been sent." }
  }, { path: "/api/mobile/auth/forgot-password", method: "POST" })
}
