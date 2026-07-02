import { NextRequest } from "next/server"
import { withErrorHandling } from "@/lib/error-handler"
import { requireMobileTrainer, trainerOwnsGroup } from "@/lib/mobile-trainer"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const { groupId } = await params
    await trainerOwnsGroup(account.trainerId, groupId)
    const group = await prisma.trainerGroup.findUniqueOrThrow({ where: { id: groupId }, include: { members: { include: { member: true } }, workouts: true, schedules: { include: { workout: true }, orderBy: { date: "desc" } } } })
    return { success: true, group }
  }, { path: "/api/mobile/trainer/groups/[groupId]", method: "GET" })
}
