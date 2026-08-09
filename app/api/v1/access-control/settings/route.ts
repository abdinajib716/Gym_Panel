import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"
import { settingsUpdateSchema } from "@/lib/validations/access-control"

function withoutSensitiveSettings<T extends { waafiApiKey?: string | null } | null>(settings: T) {
  if (!settings) return settings
  const { waafiApiKey: _waafiApiKey, ...safeSettings } = settings
  return safeSettings
}

async function getGlobalSettings() {
  return prisma.accessControlSettings.upsert({
    where: { key: "global" },
    update: {},
    create: {
      key: "global",
      fromName: "Startap Admin",
      fromEmail: "hello@startap.dev",
      smtpHost: "smtp.mailtrap.io",
      smtpPort: 587,
      smtpUsername: "mailer-user",
      smtpPassword: "mailer-password",
    },
  })
}

export async function GET() {
  return withErrorHandling(async () => {
    await requirePermission("settings.view")

    const settings = await getGlobalSettings()

    return { settings: withoutSensitiveSettings(settings) }
  }, { path: "/api/v1/access-control/settings", method: "GET" })
}

export async function PUT(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requirePermission("settings.update")

    const payload = settingsUpdateSchema.parse(await request.json())

    const settings = await prisma.accessControlSettings.upsert({
      where: { key: "global" },
      update: payload,
      create: {
        key: "global",
        ...payload,
      },
    })

    await createActivityLog({
      type: "settings",
      activity: "Updated system settings",
      subject: "Access Control Settings",
      subjectId: settings.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
      metadata: payload,
    })

    return { settings: withoutSensitiveSettings(settings), message: "Settings updated successfully" }
  }, { path: "/api/v1/access-control/settings", method: "PUT" })
}
