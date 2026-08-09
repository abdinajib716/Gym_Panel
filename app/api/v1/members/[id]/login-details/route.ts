import { NextRequest } from "next/server"

import { requirePermission } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import { getMemberLoginDetails } from "@/lib/mobile-credentials"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await requirePermission("member_credentials.view")
    const { id } = await params
    return getMemberLoginDetails(id, {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    })
  }, { path: "/api/v1/members/[id]/login-details", method: "GET" })
}
