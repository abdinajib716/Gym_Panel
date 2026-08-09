import { randomUUID } from "node:crypto"

import { AppError } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"

export type WaafiProvider = "EVC_PLUS" | "JEEB" | "ZAAD" | "SAHAL"

export function normalizeWaafiApiBaseUrl(input?: string | null) {
  const value = (input || "").trim()
  const matches = value.split(/(?=https?:\/\/)/).map((part) => part.trim()).filter(Boolean)

  if (!matches?.length) return value
  return matches[matches.length - 1]
}

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
  return randomUUID()
}

function formatWaafiTimestamp() {
  const now = new Date()
  const pad = (value: number, length = 2) => String(value).padStart(length, "0")
  return [
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(now.getMilliseconds(), 3)}`,
  ].join(" ")
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
    waafiApiBaseUrl: normalizeWaafiApiBaseUrl(settings.waafiApiBaseUrl),
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
    ["API Base URL", normalizeWaafiApiBaseUrl(config.waafiApiBaseUrl)],
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
  description?: string
}) {
  return {
    schemaVersion: "1.0",
    requestId: input.requestId,
    timestamp: formatWaafiTimestamp(),
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
        description: input.description || `Gym payment ${input.referenceId}`,
      },
    },
  }
}

export function isWaafiSuccess(response: unknown) {
  if (!response || typeof response !== "object") return false
  const payload = response as {
    responseCode?: string | number
    errorCode?: string | number
    responseMsg?: string
    params?: { state?: string }
  }
  const responseCode = String(payload.responseCode ?? "")
  const errorCode = String(payload.errorCode ?? "")
  const state = String(payload.params?.state ?? "").toUpperCase()

  return responseCode === "2001" && (errorCode === "0" || errorCode === "") && ["APPROVED", "SUCCESS", "COMPLETED"].some((value) => state.includes(value))
}

export function getWaafiResponseMessage(response: unknown) {
  if (!response || typeof response !== "object") return null
  const payload = response as {
    responseMsg?: unknown
    params?: { description?: unknown }
  }

  return typeof payload.responseMsg === "string"
    ? payload.responseMsg
    : typeof payload.params?.description === "string"
      ? payload.params.description
      : null
}

export function getWaafiResponseId(response: unknown) {
  if (!response || typeof response !== "object") return null
  const payload = response as { responseId?: unknown }
  return typeof payload.responseId === "string" ? payload.responseId : null
}

export function getWaafiOrderId(response: unknown) {
  if (!response || typeof response !== "object") return null
  const payload = response as { params?: { orderId?: unknown } }
  return typeof payload.params?.orderId === "string" ? payload.params.orderId : null
}

export function mapWaafiStatus(response: unknown): "PAID" | "PENDING" | "FAILED" | "CANCELLED" {
  if (isWaafiSuccess(response)) return "PAID"
  const text = JSON.stringify(response).toLowerCase()
  if (text.includes("success") || text.includes("paid") || text.includes("approved")) return "PAID"
  if (text.includes("cancel")) return "CANCELLED"
  if (text.includes("fail") || text.includes("error") || text.includes("reject")) return "FAILED"
  return "PENDING"
}

export async function sendWaafiPaymentRequest(payload: unknown, apiBaseUrl: string, timeoutMs = 90000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  const url = normalizeWaafiApiBaseUrl(apiBaseUrl)

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    const contentType = response.headers.get("content-type") || ""
    const rawText = await response.text()
    let body: unknown = rawText

    if (contentType.includes("application/json")) {
      try {
        body = JSON.parse(rawText)
      } catch {
        body = { rawText }
      }
    }

    return {
      ok: response.ok,
      waafiOk: isWaafiSuccess(body),
      status: response.status,
      statusText: response.statusText,
      contentType,
      url,
      body,
      rawText,
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      const body = {
        responseMsg: "WaafiPay request timed out while waiting for customer response",
        timeoutMs,
      }

      return {
        ok: false,
        waafiOk: false,
        status: 504,
        statusText: "Gateway Timeout",
        contentType: "application/json",
        url,
        body,
        rawText: JSON.stringify(body),
      }
    }

    throw error
  } finally {
    clearTimeout(timeout)
  }
}
