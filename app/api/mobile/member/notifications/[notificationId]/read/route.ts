import { NextRequest } from "next/server"

import { AppError, withErrorHandling } from "@/lib/error-handler"
import { requireMobileMember, safeNotification } from "@/lib/mobile-member"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ notificationId: string }> }) {
  return withErrorHandling(async () => {
    const account = await requireMobileMember(request)
    const { notificationId } = await params

    const existing = await prisma.notification.findFirst({
      where: { id: notificationId, memberId: account.memberId },
    })
    if (!existing) throw new AppError(404, "Notification not found")

    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { readStatus: "READ" },
    })

    return {
      success: true,
      notification: safeNotification(notification),
    }
  }, { path: "/api/mobile/member/notifications/[notificationId]/read", method: "PATCH" })
}
