import { NextRequest } from "next/server"

import { AppError, withErrorHandling } from "@/lib/error-handler"
import { requireMobileMember } from "@/lib/mobile-member"
import { prisma } from "@/lib/prisma"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ notificationId: string }> }) {
  return withErrorHandling(async () => {
    const account = await requireMobileMember(request)
    const { notificationId } = await params

    const existing = await prisma.notification.findFirst({
      where: { id: notificationId, memberId: account.memberId },
    })
    if (!existing) throw new AppError(404, "Notification not found")

    await prisma.notification.delete({ where: { id: notificationId } })

    return {
      success: true,
      message: "Notification deleted",
    }
  }, { path: "/api/mobile/member/notifications/[notificationId]", method: "DELETE" })
}
