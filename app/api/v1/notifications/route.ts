import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { emptyToNull, paginationMeta } from "@/lib/gym-api"
import { withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"
import { gymPaginationQuerySchema, notificationSchema } from "@/lib/validations/gym"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    await requirePermission("notifications.view")

    const { searchParams } = new URL(request.url)
    const { page, limit, search, type, memberId } = gymPaginationQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      memberId: searchParams.get("memberId") ?? undefined,
    })

    const where = {
      ...(type ? { type } : {}),
      ...(memberId ? { memberId } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { message: { contains: search, mode: "insensitive" as const } },
              { member: { fullName: { contains: search, mode: "insensitive" as const } } },
            ],
        }
      : {}),
    } as never

    const [notifications, total, members] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { member: true },
      }),
      prisma.notification.count({ where }),
      prisma.member.findMany({ orderBy: { fullName: "asc" } }),
    ])

    return { notifications, members, pagination: paginationMeta(total, page, limit) }
  }, { path: "/api/v1/notifications", method: "GET" })
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requirePermission("notifications.create")
    const payload = notificationSchema.parse(await request.json())

    const notification = await prisma.notification.create({
      data: {
        title: payload.title,
        message: payload.message,
        type: payload.type,
        target: payload.target,
        memberId: payload.target === "SINGLE_MEMBER" ? emptyToNull(payload.memberId) : null,
        readStatus: payload.readStatus,
      },
      include: { member: true },
    })

    await createActivityLog({
      type: "notifications",
      activity: "Sent notification",
      subject: notification.title,
      subjectId: notification.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
    })

    return { notification, message: "Notification sent successfully" }
  }, { path: "/api/v1/notifications", method: "POST" })
}
