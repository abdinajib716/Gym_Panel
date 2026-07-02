import { NextRequest } from "next/server"

import { AppError, withErrorHandling } from "@/lib/error-handler"
import { createMobileToken, mobileProfile, validateMobileLogin } from "@/lib/mobile-auth"

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const payload = await request.json().catch(() => ({})) as { identifier?: string; email?: string; password?: string }
    const account = await validateMobileLogin(payload.identifier || payload.email || "", payload.password || "")
    if (account.role !== "TRAINER" || !account.trainer) throw new AppError(403, "Trainer access required")
    return {
      success: true,
      token: createMobileToken({ accountId: account.id, role: "TRAINER" }),
      role: "TRAINER",
      trainer: { ...mobileProfile(account), specialty: account.trainer.specialty, availability: account.trainer.availability },
    }
  }, { path: "/api/mobile/trainer/auth/login", method: "POST" })
}
