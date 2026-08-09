import { NextRequest } from "next/server"
import { withErrorHandling } from "@/lib/error-handler"
import { requireMobileTrainer } from "@/lib/mobile-trainer"

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    await requireMobileTrainer(request)
    return { success: true, message: "Logged out successfully" }
  }, { path: "/api/mobile/trainer/auth/logout", method: "POST" })
}
