import { NextRequest } from "next/server"

import { withErrorHandling } from "@/lib/error-handler"
import { requireMobileMember, safeSubscription } from "@/lib/mobile-member"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileMember(request)
    const subscription = await prisma.subscription.findFirst({
      where: {
        memberId: account.memberId,
        status: "ACTIVE",
        expiryDate: { gte: new Date() },
      },
      include: { plan: true },
      orderBy: { expiryDate: "desc" },
    })

    return {
      success: true,
      subscription: subscription ? safeSubscription(subscription) : null,
    }
  }, { path: "/api/mobile/member/subscription/current", method: "GET" })
}
