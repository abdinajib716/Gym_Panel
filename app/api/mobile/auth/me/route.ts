import { NextRequest } from "next/server"

import { withErrorHandling } from "@/lib/error-handler"
import { mobileProfile, requireMobileAccount } from "@/lib/mobile-auth"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileAccount(request)
    return {
      success: true,
      user: mobileProfile(account),
    }
  }, { path: "/api/mobile/auth/me", method: "GET" })
}
