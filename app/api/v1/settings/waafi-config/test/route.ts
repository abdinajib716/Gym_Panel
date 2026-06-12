import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import {
  buildWaafiPayload,
  buildWaafiRequestId,
  getWaafiResponseMessage,
  getWaafiConfig,
  normalizeSomaliaPhoneNumber,
  sendWaafiPaymentRequest,
  validateWaafiConfig,
} from "@/lib/payments/waafi.service"
import { waafiTestSchema } from "@/lib/validations/access-control"

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requirePermission("waafi_config.test")
    const payload = waafiTestSchema.parse(await request.json())
    const config = await getWaafiConfig()
    validateWaafiConfig(config)

    const phoneNumber = normalizeSomaliaPhoneNumber(`252${payload.phoneLocal}`)
    const requestId = buildWaafiRequestId()
    const waafiPayload = buildWaafiPayload({
      merchantUid: config.waafiMerchantUid || "",
      apiUserId: config.waafiApiUserId || "",
      apiKey: config.waafiApiKey || "",
      phoneNumber,
      amount: payload.amount,
      currency: "USD",
      referenceId: `TEST-${requestId}`,
      invoiceId: `TEST-INV-${requestId}`,
      requestId,
      description: "Gym WaafiPay test payment",
    })

    const response = await sendWaafiPaymentRequest(waafiPayload, config.waafiApiBaseUrl || "")

    await createActivityLog({
      type: "waafi_config",
      activity: "Tested WaafiPay connection",
      subject: "Waafi Config",
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
      metadata: {
        ok: response.ok,
        waafiOk: response.waafiOk,
        status: response.status,
        provider: payload.provider,
        phoneNumber,
        amount: payload.amount,
        requestId,
      },
    })

    return {
      ok: response.ok && response.waafiOk,
      httpOk: response.ok,
      waafiOk: response.waafiOk,
      status: response.status,
      statusText: response.statusText,
      contentType: response.contentType,
      url: response.url,
      message: getWaafiResponseMessage(response.body) || (response.ok && response.waafiOk ? "WaafiPay test request sent" : "WaafiPay test request failed"),
      request: {
        requestId,
        provider: payload.provider,
        phoneNumber,
        amount: payload.amount,
        currency: "USD",
      },
      sentPayload: {
        ...waafiPayload,
        serviceParams: {
          ...waafiPayload.serviceParams,
          apiKey: "***",
        },
      },
      waafiResponse: response.body,
      rawResponse: response.rawText,
    }
  }, { path: "/api/v1/settings/waafi-config/test", method: "POST" })
}
