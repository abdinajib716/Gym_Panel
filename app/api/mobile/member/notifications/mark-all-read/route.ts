import { NextRequest } from "next/server"

import { withErrorHandling } from "@/lib/error-handler"
import { requireMobileMember } from "@/lib/mobile-member"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileMember(request)
    const result = await prisma.notification.updateMany({
      where: {
        memberId: account.memberId,
        readStatus: "UNREAD",
      },
      data: { readStatus: "READ" },
    })

    return {
      success: true,
      message: "All notifications marked as read",
      updatedCount: result.count,
    }
  }, { path: "/api/mobile/member/notifications/mark-all-read", method: "PATCH" })
}
