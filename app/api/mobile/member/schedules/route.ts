import { NextRequest } from "next/server"
import { withErrorHandling } from "@/lib/error-handler"
import { requireMobileMember } from "@/lib/mobile-member"
import { scheduleInclude } from "@/lib/mobile-trainer"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileMember(request)
    const schedules = await prisma.trainerSchedule.findMany({ where: { OR: [{ memberId: account.memberId }, { group: { members: { some: { memberId: account.memberId } } } }] }, include: scheduleInclude, orderBy: [{ date: "desc" }, { startTime: "asc" }] })
    return { success: true, schedules }
  }, { path: "/api/mobile/member/schedules", method: "GET" })
}
