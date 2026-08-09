import { NextRequest } from "next/server"

import { AppError, withErrorHandling } from "@/lib/error-handler"
import { requireMobileMember, safeAttendance } from "@/lib/mobile-member"
import { prisma } from "@/lib/prisma"

function parseDate(value: string | null, field: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new AppError(400, `Invalid ${field}`)
  return date
}

function periodRange(period: string | null) {
  if (!period || period === "all") return {}

  const end = new Date()
  const start = new Date(end)

  if (period === "today") {
    start.setHours(0, 0, 0, 0)
  } else if (period === "weekly") {
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)
  } else if (period === "monthly") {
    start.setDate(start.getDate() - 29)
    start.setHours(0, 0, 0, 0)
  } else {
    throw new AppError(400, "Attendance period must be today, weekly, monthly, or all")
  }

  return { gte: start, lte: end }
}

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileMember(request)
    const params = new URL(request.url).searchParams
    const dateFrom = parseDate(params.get("dateFrom"), "dateFrom")
    const dateTo = parseDate(params.get("dateTo"), "dateTo")
    const limit = Math.min(Math.max(Number(params.get("limit") || 50), 1), 100)

    const checkInDate = dateFrom || dateTo
      ? {
          ...(dateFrom ? { gte: dateFrom } : {}),
          ...(dateTo ? { lte: dateTo } : {}),
        }
      : periodRange(params.get("period"))

    const where = {
      memberId: account.memberId,
      ...(Object.keys(checkInDate).length ? { checkInDate } : {}),
    }

    const [attendance, total, present, cancelled, lastCheckIn] = await Promise.all([
      prisma.attendance.findMany({
        where,
        orderBy: { checkInDate: "desc" },
        take: limit,
      }),
      prisma.attendance.count({ where }),
      prisma.attendance.count({ where: { ...where, status: "PRESENT" } }),
      prisma.attendance.count({ where: { ...where, status: "CANCELLED" } }),
      prisma.attendance.findFirst({ where: { memberId: account.memberId, status: "PRESENT" }, orderBy: { checkInDate: "desc" } }),
    ])

    return {
      success: true,
      summary: {
        total,
        present,
        cancelled,
        lastCheckIn: lastCheckIn?.checkInDate ?? null,
      },
      attendance: attendance.map(safeAttendance),
    }
  }, { path: "/api/mobile/member/attendance", method: "GET" })
}
