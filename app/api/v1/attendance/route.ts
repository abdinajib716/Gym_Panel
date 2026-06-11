import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { dateRangeFilter, paginationMeta, requiredDate } from "@/lib/gym-api"
import { withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"
import { attendanceSchema, gymPaginationQuerySchema } from "@/lib/validations/gym"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    await requirePermission("attendance.view")

    const { searchParams } = new URL(request.url)
    const { page, limit, search, status, memberId, dateFrom, dateTo } = gymPaginationQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      memberId: searchParams.get("memberId") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
    })

    const where = {
      ...(status ? { status } : {}),
      ...(memberId ? { memberId } : {}),
      ...(dateFrom || dateTo ? { checkInDate: dateRangeFilter(dateFrom, dateTo) } : {}),
      ...(search ? { member: { fullName: { contains: search, mode: "insensitive" as const } } } : {}),
    } as never

    const [attendance, total, members] = await Promise.all([
      prisma.attendance.findMany({
        where,
        orderBy: { checkInDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { member: true },
      }),
      prisma.attendance.count({ where }),
      prisma.member.findMany({ orderBy: { fullName: "asc" } }),
    ])

    return { attendance, members, pagination: paginationMeta(total, page, limit) }
  }, { path: "/api/v1/attendance", method: "GET" })
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requirePermission("attendance.create")
    const payload = attendanceSchema.parse(await request.json())

    const attendance = await prisma.attendance.create({
      data: {
        memberId: payload.memberId,
        checkInDate: requiredDate(payload.checkInDate),
        method: payload.method,
        status: payload.status,
      },
      include: { member: true },
    })

    await createActivityLog({
      type: "attendance",
      activity: "Created attendance check-in",
      subject: attendance.member.fullName,
      subjectId: attendance.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
    })

    return { attendance, message: "Attendance recorded successfully" }
  }, { path: "/api/v1/attendance", method: "POST" })
}
