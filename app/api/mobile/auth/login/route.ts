import { NextRequest } from "next/server"

import { withErrorHandling } from "@/lib/error-handler"
import { createMobileToken, mobileProfile, validateMobileLogin } from "@/lib/mobile-auth"

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const payload = (await request.json().catch(() => ({}))) as {
      email?: string
      Email?: string
      identifier?: string
      password?: string
    }
    const identifier = payload.identifier || payload.email || payload.Email || ""
    const password = payload.password || ""
    const account = await validateMobileLogin(identifier, password)

    return {
      success: true,
      token: createMobileToken({ accountId: account.id, role: account.role }),
      role: account.role,
      user: mobileProfile(account),
    }
  }, { path: "/api/mobile/auth/login", method: "POST" })
}
