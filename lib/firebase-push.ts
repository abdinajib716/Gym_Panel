import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getMessaging, type Message } from "firebase-admin/messaging"

import { createActivityLog } from "@/lib/access-control"
import { AppError } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"

type FirebaseSettings = {
  id: string
  firebaseEnabled: boolean
  firebaseProjectId: string | null
  firebaseClientEmail: string | null
  firebasePrivateKey: string | null
}

type PushPayload = {
  title: string
  body: string
  data?: Record<string, string | number | boolean | null | undefined>
}

function normalizePrivateKey(value?: string | null) {
  return (value || "").replace(/\\n/g, "\n").trim()
}

function assertFirebaseSettings(settings: FirebaseSettings) {
  if (!settings.firebaseEnabled) {
    throw new AppError(400, "Firebase push notifications are disabled")
  }

  const missing = [
    ["Project ID", settings.firebaseProjectId],
    ["Client Email", settings.firebaseClientEmail],
    ["Private Key", normalizePrivateKey(settings.firebasePrivateKey)],
  ].filter(([, value]) => !value)

  if (missing.length > 0) {
    throw new AppError(400, `Missing Firebase configuration: ${missing.map(([label]) => label).join(", ")}`)
  }
}

function dataPayload(data?: PushPayload["data"]) {
  return Object.fromEntries(
    Object.entries(data || {})
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)]),
  )
}

export function topicForRole(role: "MEMBER" | "TRAINER") {
  return role === "MEMBER" ? "members" : "trainers"
}

export function topicForAccount(accountId: string) {
  return `mobile-account-${accountId}`
}

export async function getFirebaseSettings() {
  const settings = await prisma.accessControlSettings.findUnique({
    where: { key: "global" },
  })

  if (!settings) throw new AppError(404, "Firebase settings not found")
  return settings
}

export async function getFirebaseMessaging() {
  const settings = await getFirebaseSettings()
  assertFirebaseSettings(settings)

  const appName = `gym-firebase-${settings.id}`
  const app = getApps().find((entry) => entry.name === appName) || initializeApp({
    credential: cert({
      projectId: settings.firebaseProjectId || "",
      clientEmail: settings.firebaseClientEmail || "",
      privateKey: normalizePrivateKey(settings.firebasePrivateKey),
    }),
    projectId: settings.firebaseProjectId || "",
  }, appName)

  return getMessaging(app)
}

export async function testFirebaseConnection() {
  const messaging = await getFirebaseMessaging()
  const message: Message = {
    topic: "firebase-config-test",
    notification: {
      title: "Firebase test",
      body: "Firebase push notification configuration is valid.",
    },
    data: {
      source: "gym-admin-settings",
      dryRun: "true",
    },
  }

  const messageId = await messaging.send(message, true)
  return {
    success: true,
    message: "Firebase connection test succeeded",
    dryRun: true,
    target: "topic:firebase-config-test",
    messageId,
  }
}

export async function registerMobileDeviceToken(input: {
  accountId: string
  role: "MEMBER" | "TRAINER"
  token: string
  platform?: "ANDROID" | "IOS" | "WEB" | "UNKNOWN"
  deviceName?: string | null
}) {
  const topic = topicForRole(input.role)
  const token = await prisma.mobileDeviceToken.upsert({
    where: { token: input.token },
    update: {
      accountId: input.accountId,
      role: input.role,
      platform: input.platform || "UNKNOWN",
      deviceName: input.deviceName || null,
      topic,
      lastSeenAt: new Date(),
    },
    create: {
      accountId: input.accountId,
      role: input.role,
      token: input.token,
      platform: input.platform || "UNKNOWN",
      deviceName: input.deviceName || null,
      topic,
    },
  })

  try {
    const messaging = await getFirebaseMessaging()
    await Promise.all([
      messaging.subscribeToTopic([input.token], topic),
      messaging.subscribeToTopic([input.token], topicForAccount(input.accountId)),
    ])
  } catch {
    // Token registration should still succeed when Firebase credentials are being configured.
  }

  return token
}

export async function sendPushToTokens(tokens: string[], payload: PushPayload) {
  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0, responses: [] }
  }

  const messaging = await getFirebaseMessaging()
  const result = await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: dataPayload(payload.data),
  })

  return result
}

export async function sendPushToRoleTopic(role: "MEMBER" | "TRAINER", payload: PushPayload) {
  const messaging = await getFirebaseMessaging()
  const messageId = await messaging.send({
    topic: topicForRole(role),
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: dataPayload(payload.data),
  })

  return { messageId, topic: topicForRole(role) }
}

export async function sendPushForNotification(input: {
  notificationId: string
  title: string
  message: string
  memberId?: string | null
  roleTarget?: "MEMBER" | "TRAINER" | null
}) {
  if (input.roleTarget) {
    const result = await sendPushToRoleTopic(input.roleTarget, {
      title: input.title,
      body: input.message,
      data: { notificationId: input.notificationId, role: input.roleTarget },
    })

    await createActivityLog({
      type: "notifications",
      activity: "Sent Firebase role push notification",
      subject: input.title,
      subjectId: input.notificationId,
      metadata: result,
    })

    return result
  }

  if (!input.memberId) return null

  const tokens = await prisma.mobileDeviceToken.findMany({
    where: {
      role: "MEMBER",
      account: { memberId: input.memberId },
    },
    select: { token: true },
  })

  const result = await sendPushToTokens(tokens.map((entry) => entry.token), {
    title: input.title,
    body: input.message,
    data: { notificationId: input.notificationId, memberId: input.memberId },
  })

  await createActivityLog({
    type: "notifications",
    activity: "Sent Firebase member push notification",
    subject: input.title,
    subjectId: input.notificationId,
    metadata: {
      successCount: result.successCount,
      failureCount: result.failureCount,
    },
  })

  return {
    successCount: result.successCount,
    failureCount: result.failureCount,
  }
}
