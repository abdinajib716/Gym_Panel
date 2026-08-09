import { NextRequest } from "next/server"

import { AppError, withErrorHandling } from "@/lib/error-handler"
import { registerMobileDeviceToken, topicForAccount, topicForRole } from "@/lib/firebase-push"
import { requireMobileAccount } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"

const platforms = ["ANDROID", "IOS", "WEB", "UNKNOWN"] as const

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileAccount(request)
    const payload = (await request.json().catch(() => ({}))) as {
      token?: string
      platform?: typeof platforms[number]
      deviceName?: string
    }

    if (!payload.token?.trim()) throw new AppError(400, "FCM device token is required")
    if (payload.platform && !platforms.includes(payload.platform)) throw new AppError(400, "Device platform is invalid")

    const token = await registerMobileDeviceToken({
      accountId: account.id,
      role: account.role,
      token: payload.token.trim(),
      platform: payload.platform || "UNKNOWN",
      deviceName: payload.deviceName || null,
    })

    return {
      success: true,
      message: "Device token registered",
      deviceToken: {
        id: token.id,
        platform: token.platform,
        deviceName: token.deviceName,
        role: token.role,
        topic: topicForRole(account.role),
        accountTopic: topicForAccount(account.id),
        lastSeenAt: token.lastSeenAt,
      },
    }
  }, { path: "/api/mobile/device-tokens", method: "POST" })
}

export async function DELETE(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileAccount(request)
    const payload = (await request.json().catch(() => ({}))) as { token?: string }
    if (!payload.token?.trim()) throw new AppError(400, "FCM device token is required")

    await prisma.mobileDeviceToken.deleteMany({
      where: {
        accountId: account.id,
        token: payload.token.trim(),
      },
    })

    return {
      success: true,
      message: "Device token removed",
    }
  }, { path: "/api/mobile/device-tokens", method: "DELETE" })
}
