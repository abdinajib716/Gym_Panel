import { NextRequest } from "next/server"

import { withErrorHandling } from "@/lib/error-handler"
import { requireMobileMember, safeNotification } from "@/lib/mobile-member"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileMember(request)
    const notifications = await prisma.notification.findMany({
      where: { memberId: account.memberId },
      orderBy: { createdAt: "desc" },
    })

    return {
      success: true,
      notifications: notifications.map(safeNotification),
    }
  }, { path: "/api/mobile/member/notifications", method: "GET" })
}
