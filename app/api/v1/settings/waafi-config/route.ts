import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import { getSafeWaafiConfig } from "@/lib/payments/waafi.service"
import { prisma } from "@/lib/prisma"
import { waafiConfigSchema } from "@/lib/validations/access-control"

export async function GET() {
  return withErrorHandling(async () => {
    await requirePermission("waafi_config.view")
    return { config: await getSafeWaafiConfig() }
  }, { path: "/api/v1/settings/waafi-config", method: "GET" })
}

export async function PUT(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requirePermission("waafi_config.update")
    const payload = waafiConfigSchema.parse(await request.json())
    const current = await prisma.accessControlSettings.findUniqueOrThrow({ where: { key: "global" } })

    const settings = await prisma.accessControlSettings.update({
      where: { id: current.id },
      data: {
        waafiEnabled: payload.waafiEnabled,
        waafiEnvironment: payload.waafiEnvironment,
        waafiApiBaseUrl: payload.waafiApiBaseUrl || null,
        waafiMerchantUid: payload.waafiMerchantUid || null,
        waafiApiUserId: payload.waafiApiUserId || null,
        waafiMerchantNumber: payload.waafiMerchantNumber || null,
        ...(payload.waafiApiKey ? { waafiApiKey: payload.waafiApiKey } : {}),
      },
    })

    await createActivityLog({
      type: "waafi_config",
      activity: "Updated WaafiPay configuration",
      subject: "Waafi Config",
      subjectId: settings.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
      metadata: {
        enabled: settings.waafiEnabled,
        environment: settings.waafiEnvironment,
        apiBaseUrl: settings.waafiApiBaseUrl,
        merchantUid: settings.waafiMerchantUid,
        merchantNumber: settings.waafiMerchantNumber,
        apiKeyConfigured: Boolean(settings.waafiApiKey),
      },
    })

    return { config: await getSafeWaafiConfig(), message: "Waafi configuration saved successfully" }
  }, { path: "/api/v1/settings/waafi-config", method: "PUT" })
}
