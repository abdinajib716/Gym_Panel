import { NextRequest } from "next/server"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { requireMobileTrainer, scheduleInclude, trainerOwnsMember, workoutInclude } from "@/lib/mobile-trainer"
import { prisma } from "@/lib/prisma"

function attendanceRange(period?: string | null, dateFrom?: string | null, dateTo?: string | null) {
  if (dateFrom || dateTo) {
    return {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    }
  }

  if (!period || period === "all") return undefined

  const end = new Date()
  const start = new Date(end)
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)

  if (period === "today") return { gte: start, lte: end }
  if (period === "weekly") {
    start.setDate(start.getDate() - 6)
    return { gte: start, lte: end }
  }
  if (period === "monthly") {
    start.setDate(1)
    return { gte: start, lte: end }
  }

  return undefined
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ memberId: string; resource: string }> }) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const { memberId, resource } = await params
    await trainerOwnsMember(account.trainerId, memberId)
    if (resource === "attendance") {
      const searchParams = new URL(request.url).searchParams
      const period = searchParams.get("period")
      const dateFrom = searchParams.get("dateFrom") || searchParams.get("date_from")
      const dateTo = searchParams.get("dateTo") || searchParams.get("date_to")
      const limit = Math.min(Math.max(Number(searchParams.get("limit") || 50), 1), 100)
      const range = attendanceRange(period, dateFrom, dateTo)
      return {
        success: true,
        filters: { period, dateFrom, dateTo, limit },
        attendance: await prisma.attendance.findMany({
          where: { memberId, ...(range ? { checkInDate: range } : {}) },
          orderBy: { checkInDate: "desc" },
          take: limit,
        }),
      }
    }
    if (resource === "workouts") return { success: true, workouts: await prisma.workout.findMany({ where: { trainerId: account.trainerId, memberId }, include: workoutInclude, orderBy: { createdAt: "desc" } }) }
    if (resource === "schedules") return { success: true, schedules: await prisma.trainerSchedule.findMany({ where: { trainerId: account.trainerId, memberId }, include: scheduleInclude, orderBy: { date: "desc" } }) }
    throw new AppError(404, "Resource not found")
  }, { path: "/api/mobile/trainer/members/[memberId]/[resource]", method: "GET" })
}
