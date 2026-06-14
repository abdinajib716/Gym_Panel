import { NextRequest } from "next/server"

import { withErrorHandling } from "@/lib/error-handler"
import { requireMobileMember, safeSubscription } from "@/lib/mobile-member"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileMember(request)
    const subscriptions = await prisma.subscription.findMany({
      where: { memberId: account.memberId },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    })

    return {
      success: true,
      subscriptions: subscriptions.map(safeSubscription),
    }
  }, { path: "/api/mobile/member/subscription/history", method: "GET" })
}
