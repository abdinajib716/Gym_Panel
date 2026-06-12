import { NextRequest } from "next/server"

import { createActivityLog, ensureAccessControlSeed } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { sendConfiguredEmail } from "@/lib/email/email.service"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requirePermission("settings.update")
    await ensureAccessControlSeed()

    const payload = (await request.json().catch(() => ({}))) as {
      toEmail?: string
    }

    const settings = await prisma.accessControlSettings.findUnique({
      where: { key: "global" },
    })

    if (!settings) {
      throw new AppError(404, "Settings not found")
    }

    const targetEmail = payload.toEmail || settings.fromEmail

    if (!targetEmail) {
      throw new AppError(400, "Please provide a valid destination email")
    }

    await sendConfiguredEmail({
      to: targetEmail,
      subject: `${settings.siteName} email configuration test`,
      text: `Hello,

This is a test email from ${settings.siteName}.

Your email configuration is working.`,
    })

    await createActivityLog({
      type: "settings",
      activity: "Triggered a test email configuration check",
      subject: "Email Configuration",
      subjectId: settings.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
      metadata: {
        targetEmail,
        driver: settings.mailDriver,
      },
    })

    return {
      message: `Test email sent successfully to ${targetEmail}`,
    }
  }, { path: "/api/v1/access-control/settings/test-email", method: "POST" })
}
