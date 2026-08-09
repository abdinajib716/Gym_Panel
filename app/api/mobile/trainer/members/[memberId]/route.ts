import { NextRequest } from "next/server"
import { withErrorHandling } from "@/lib/error-handler"
import { requireMobileTrainer, trainerOwnsMember } from "@/lib/mobile-trainer"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const { memberId } = await params
    await trainerOwnsMember(account.trainerId, memberId)
    const member = await prisma.member.findUniqueOrThrow({ where: { id: memberId }, include: { subscriptions: { orderBy: { createdAt: "desc" }, include: { plan: true } }, attendance: { orderBy: { checkInDate: "desc" }, take: 30 }, workouts: { orderBy: { createdAt: "desc" }, take: 20 }, trainerSchedules: { orderBy: { date: "desc" }, take: 20, include: { workout: true } }, groupMemberships: { include: { group: true } } } })
    return { success: true, member }
  }, { path: "/api/mobile/trainer/members/[memberId]", method: "GET" })
}
