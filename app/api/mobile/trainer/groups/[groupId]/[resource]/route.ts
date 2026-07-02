import { NextRequest } from "next/server"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { requireMobileTrainer, scheduleInclude, trainerOwnsGroup, workoutInclude } from "@/lib/mobile-trainer"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: Promise<{ groupId: string; resource: string }> }) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const { groupId, resource } = await params
    await trainerOwnsGroup(account.trainerId, groupId)
    if (resource === "members") return { success: true, members: (await prisma.trainerGroupMember.findMany({ where: { groupId }, include: { member: true } })).map((entry) => entry.member) }
    if (resource === "workouts") return { success: true, workouts: await prisma.workout.findMany({ where: { trainerId: account.trainerId, groupId }, include: workoutInclude, orderBy: { createdAt: "desc" } }) }
    if (resource === "schedules") return { success: true, schedules: await prisma.trainerSchedule.findMany({ where: { trainerId: account.trainerId, groupId }, include: scheduleInclude, orderBy: { date: "desc" } }) }
    throw new AppError(404, "Resource not found")
  }, { path: "/api/mobile/trainer/groups/[groupId]/[resource]", method: "GET" })
}
