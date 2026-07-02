import { NextRequest } from "next/server"
import { withErrorHandling } from "@/lib/error-handler"
import { requireMobileMember } from "@/lib/mobile-member"
import { dayBounds, scheduleInclude } from "@/lib/mobile-trainer"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileMember(request)
    const { start, end } = dayBounds()
    const schedules = await prisma.trainerSchedule.findMany({ where: { date: { gte: start, lt: end }, OR: [{ memberId: account.memberId }, { group: { members: { some: { memberId: account.memberId } } } }] }, include: scheduleInclude, orderBy: { startTime: "asc" } })
    return { success: true, schedules }
  }, { path: "/api/mobile/member/schedules/today", method: "GET" })
}
