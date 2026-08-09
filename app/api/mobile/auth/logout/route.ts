import { NextRequest } from "next/server"

import { withErrorHandling } from "@/lib/error-handler"
import { requireMobileAccount } from "@/lib/mobile-auth"

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    await requireMobileAccount(request)
    return {
      success: true,
      message: "Logged out successfully",
    }
  }, { path: "/api/mobile/auth/logout", method: "POST" })
}
