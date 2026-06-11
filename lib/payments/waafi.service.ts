import { randomUUID } from "node:crypto"

import { AppError } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"

export type WaafiProvider = "EVC_PLUS" | "JEEB" | "ZAAD" | "SAHAL"

export function normalizeSomaliaPhoneNumber(input: string) {
  const digits = input.replace(/\D/g, "")
  let normalized = digits

  if (normalized.startsWith("0")) {
    normalized = normalized.slice(1)
  }

  if (!normalized.startsWith("252")) {
    normalized = `252${normalized}`
  }

  if (!/^252(61|62|63|65|66|67|68|69|77|90)\d{7}$/.test(normalized)) {
    throw new AppError(400, "Enter a valid Somalia mobile number")
  }

  return normalized
}

export function buildWaafiRequestId() {
  const timestamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14)
  return `REQ-${timestamp}-${randomUUID().slice(0, 8).toUpperCase()}`
}

export async function getWaafiConfig() {
  const settings = await prisma.accessControlSettings.findUnique({
    where: { key: "global" },
  })

  if (!settings) {
    throw new AppError(404, "Waafi configuration not found")
  }

  return settings
}

export async function getSafeWaafiConfig() {
  const settings = await getWaafiConfig()

  return {
    waafiEnabled: settings.waafiEnabled,
    waafiEnvironment: settings.waafiEnvironment as "test" | "live",
    waafiApiBaseUrl: settings.waafiApiBaseUrl,
    waafiMerchantUid: settings.waafiMerchantUid,
    waafiApiUserId: settings.waafiApiUserId,
    waafiMerchantNumber: settings.waafiMerchantNumber,
    waafiApiKeyConfigured: Boolean(settings.waafiApiKey),
  }
}

export function validateWaafiConfig(config: Awaited<ReturnType<typeof getWaafiConfig>>) {
  if (!config.waafiEnabled) {
    throw new AppError(400, "WaafiPay is disabled")
  }

  const missing = [
    ["API Base URL", config.waafiApiBaseUrl],
    ["Merchant UID", config.waafiMerchantUid],
    ["API User ID", config.waafiApiUserId],
    ["API Key", config.waafiApiKey],
  ].filter(([, value]) => !value)

  if (missing.length > 0) {
    throw new AppError(400, `Missing Waafi configuration: ${missing.map(([label]) => label).join(", ")}`)
  }
}

export function buildWaafiPayload(input: {
  merchantUid: string
  apiUserId: string
  apiKey: string
  phoneNumber: string
  amount: number
  currency: string
  referenceId: string
  invoiceId: string
  requestId: string
}) {
  return {
    schemaVersion: "1.0",
    requestId: input.requestId,
    timestamp: new Date().toISOString(),
    channelName: "WEB",
    serviceName: "API_PURCHASE",
    serviceParams: {
      merchantUid: input.merchantUid,
      apiUserId: input.apiUserId,
      apiKey: input.apiKey,
      paymentMethod: "MWALLET_ACCOUNT",
      payerInfo: {
        accountNo: input.phoneNumber,
      },
      transactionInfo: {
        referenceId: input.referenceId,
        invoiceId: input.invoiceId,
        amount: input.amount,
        currency: input.currency,
      },
    },
  }
}

export function mapWaafiStatus(response: unknown): "PAID" | "PENDING" | "FAILED" | "CANCELLED" {
  const text = JSON.stringify(response).toLowerCase()
  if (text.includes("success") || text.includes("paid") || text.includes("approved")) return "PAID"
  if (text.includes("cancel")) return "CANCELLED"
  if (text.includes("fail") || text.includes("error") || text.includes("reject")) return "FAILED"
  return "PENDING"
}

export async function sendWaafiPaymentRequest(payload: unknown, apiBaseUrl: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(apiBaseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    const body = await response.json().catch(() => ({ ok: response.ok, status: response.status }))
    return { ok: response.ok, status: response.status, body }
  } finally {
    clearTimeout(timeout)
  }
}
