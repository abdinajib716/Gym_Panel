import { NextRequest } from "next/server"
import { withErrorHandling } from "@/lib/error-handler"
import { requireMobileMember } from "@/lib/mobile-member"
import { dayBounds, scheduleInclude } from "@/lib/mobile-trainer"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileMember(request)
    const { start, end } = dayBounds()
    const schedules = await prisma.trainerSchedule.findMany({ where: { date: { gte: start, lt: end }, status: { not: "CANCELLED" }, OR: [{ memberId: account.memberId }, { group: { members: { some: { memberId: account.memberId } } } }] }, include: scheduleInclude, orderBy: { startTime: "asc" } })
    return { success: true, today_workouts: schedules.map((schedule) => ({ ...schedule.workout, schedule: { id: schedule.id, date: schedule.date, startTime: schedule.startTime, endTime: schedule.endTime, status: schedule.status }, trainer: schedule.trainer })) }
  }, { path: "/api/mobile/member/workouts/today", method: "GET" })
}
