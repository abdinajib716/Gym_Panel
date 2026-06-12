import { NextRequest } from "next/server"

import { requirePermission } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import { getTrainerLoginDetails } from "@/lib/mobile-credentials"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await requirePermission("trainer_credentials.view")
    const { id } = await params
    return getTrainerLoginDetails(id, {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    })
  }, { path: "/api/v1/trainers/[id]/login-details", method: "GET" })
}
