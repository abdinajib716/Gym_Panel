import { NextRequest } from "next/server"

import { withErrorHandling } from "@/lib/error-handler"
import { requireMobileMember, safeAttendance, safeSubscription } from "@/lib/mobile-member"
import { prisma } from "@/lib/prisma"

function monthRange(value = new Date()) {
  const start = new Date(value.getFullYear(), value.getMonth(), 1)
  const end = new Date(value.getFullYear(), value.getMonth() + 1, 1)
  return { start, end }
}

function lastNDays(days: number) {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)
  return { start, end }
}

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileMember(request)
    const params = new URL(request.url).searchParams
    const days = Math.min(Math.max(Number(params.get("days") || 30), 7), 365)
    const { start, end } = lastNDays(days)
    const { start: monthStart, end: monthEnd } = monthRange()
    const memberTarget = {
      OR: [
        { memberId: account.memberId },
        { group: { members: { some: { memberId: account.memberId } } } },
      ],
    }

    const [
      currentSubscription,
      totalAttendance,
      rangeAttendance,
      monthAttendance,
      lastAttendance,
      activeWorkouts,
      totalSchedules,
      completedSchedules,
      upcomingSchedules,
      missedSchedules,
      cancelledSchedules,
      recentCompletedSchedules,
    ] = await Promise.all([
      prisma.subscription.findFirst({
        where: { memberId: account.memberId, status: "ACTIVE", expiryDate: { gte: new Date() } },
        include: { plan: true },
        orderBy: { expiryDate: "desc" },
      }),
      prisma.attendance.count({ where: { memberId: account.memberId, status: "PRESENT" } }),
      prisma.attendance.count({ where: { memberId: account.memberId, status: "PRESENT", checkInDate: { gte: start, lte: end } } }),
      prisma.attendance.count({ where: { memberId: account.memberId, status: "PRESENT", checkInDate: { gte: monthStart, lt: monthEnd } } }),
      prisma.attendance.findFirst({ where: { memberId: account.memberId, status: "PRESENT" }, orderBy: { checkInDate: "desc" } }),
      prisma.workout.count({ where: { status: "ACTIVE", ...memberTarget } }),
      prisma.trainerSchedule.count({ where: memberTarget }),
      prisma.trainerSchedule.count({ where: { ...memberTarget, status: "COMPLETED" } }),
      prisma.trainerSchedule.count({ where: { ...memberTarget, status: "UPCOMING" } }),
      prisma.trainerSchedule.count({ where: { ...memberTarget, status: "MISSED" } }),
      prisma.trainerSchedule.count({ where: { ...memberTarget, status: "CANCELLED" } }),
      prisma.trainerSchedule.findMany({
        where: { ...memberTarget, status: "COMPLETED" },
        include: {
          workout: { select: { id: true, title: true, image: true, durationMinutes: true } },
          trainer: { select: { id: true, fullName: true } },
        },
        orderBy: { date: "desc" },
        take: 5,
      }),
    ])

    const completionRate = totalSchedules > 0 ? Math.round((completedSchedules / totalSchedules) * 100) : 0

    return {
      success: true,
      progress: {
        subscription: currentSubscription ? safeSubscription(currentSubscription) : null,
        attendance: {
          totalPresent: totalAttendance,
          presentInRange: rangeAttendance,
          presentThisMonth: monthAttendance,
          lastCheckIn: lastAttendance ? safeAttendance(lastAttendance) : null,
          rangeDays: days,
        },
        training: {
          activeWorkouts,
          totalSchedules,
          completedSchedules,
          upcomingSchedules,
          missedSchedules,
          cancelledSchedules,
          completionRate,
          recentCompletedSchedules,
        },
      },
    }
  }, { path: "/api/mobile/member/progress", method: "GET" })
}
