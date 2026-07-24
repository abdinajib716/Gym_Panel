import { NextRequest } from "next/server"
import { withErrorHandling } from "@/lib/error-handler"
import { dayBounds, requireMobileTrainer, scheduleInclude } from "@/lib/mobile-trainer"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const { start, end } = dayBounds()
    const [totalMembers, totalGroups, todaySchedule, upcomingSessions, completedSessions, missedSessions, recentMembers] = await Promise.all([
      prisma.member.count({ where: { trainerId: account.trainerId } }),
      prisma.trainerGroup.count({ where: { trainerId: account.trainerId } }),
      prisma.trainerSchedule.findMany({ where: { trainerId: account.trainerId, date: { gte: start, lt: end } }, include: scheduleInclude, orderBy: { startTime: "asc" } }),
      prisma.trainerSchedule.count({ where: { trainerId: account.trainerId, status: "UPCOMING", date: { gte: start } } }),
      prisma.trainerSchedule.count({ where: { trainerId: account.trainerId, status: "COMPLETED" } }),
      prisma.trainerSchedule.count({ where: { trainerId: account.trainerId, status: "MISSED" } }),
      prisma.member.findMany({ where: { trainerId: account.trainerId }, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, fullName: true, phoneNumber: true, status: true, profileImage: true } }),
    ])
    return {
      success: true,
      welcome: `Welcome ${account.trainer.fullName}`,
      trainer: { id: account.trainer.id, name: account.trainer.fullName, profileImage: account.trainer.profileImage, specialty: account.trainer.specialty },
      kpis: { total_members: totalMembers, total_groups: totalGroups, today_sessions: todaySchedule.length, upcoming_sessions: upcomingSessions, completed_sessions: completedSessions, missed_sessions: missedSessions },
      recent_members: recentMembers,
      today_schedule: todaySchedule,
    }
  }, { path: "/api/mobile/trainer/dashboard", method: "GET" })
}
