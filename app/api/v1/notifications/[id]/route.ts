import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    await requirePermission("notifications.view")
    const { id } = await params

    const notification = await prisma.notification.findUnique({
      where: { id },
      include: { member: true },
    })

    if (!notification) {
      throw new AppError(404, "Notification not found")
    }

    return { notification }
  }, { path: "/api/v1/notifications/[id]", method: "GET" })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await requirePermission("notifications.delete")
    const { id } = await params

    const existingNotification = await prisma.notification.findUnique({ where: { id } })
    if (!existingNotification) {
      throw new AppError(404, "Notification not found")
    }

    await prisma.notification.delete({ where: { id } })

    await createActivityLog({
      type: "notifications",
      activity: "Deleted notification",
      subject: existingNotification.title,
      subjectId: existingNotification.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
    })

    return { success: true, message: "Notification deleted successfully" }
  }, { path: "/api/v1/notifications/[id]", method: "DELETE" })
}
