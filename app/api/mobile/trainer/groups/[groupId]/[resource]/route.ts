import { NextRequest } from "next/server"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { requireMobileTrainer, scheduleInclude, trainerOwnsGroup, trainerOwnsMember, workoutInclude } from "@/lib/mobile-trainer"
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

export async function POST(request: NextRequest, { params }: { params: Promise<{ groupId: string; resource: string }> }) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const { groupId, resource } = await params
    if (resource !== "members") throw new AppError(404, "Resource action not found")
    await trainerOwnsGroup(account.trainerId, groupId)

    const payload = await request.json().catch(() => ({})) as {
      memberId?: string
      member_id?: string
      memberIds?: string[]
      member_ids?: string[]
    }
    const memberIds = Array.from(new Set([
      ...(payload.memberIds || []),
      ...(payload.member_ids || []),
      ...(payload.memberId || payload.member_id ? [payload.memberId || payload.member_id || ""] : []),
    ].filter(Boolean)))

    if (memberIds.length === 0) throw new AppError(400, "Member is required")
    await Promise.all(memberIds.map((memberId) => trainerOwnsMember(account.trainerId, memberId)))

    await prisma.trainerGroupMember.createMany({
      data: memberIds.map((memberId) => ({ groupId, memberId })),
      skipDuplicates: true,
    })

    const members = (await prisma.trainerGroupMember.findMany({ where: { groupId }, include: { member: true }, orderBy: { createdAt: "asc" } })).map((entry) => entry.member)
    return { success: true, members, message: "Member added to trainer group successfully" }
  }, { path: "/api/mobile/trainer/groups/[groupId]/members", method: "POST" })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ groupId: string; resource: string }> }) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const { groupId, resource } = await params
    if (resource !== "members") throw new AppError(404, "Resource action not found")
    await trainerOwnsGroup(account.trainerId, groupId)

    const payload = await request.json().catch(() => ({})) as { memberId?: string; member_id?: string }
    const memberId = payload.memberId || payload.member_id
    if (!memberId) throw new AppError(400, "Member is required")
    await trainerOwnsMember(account.trainerId, memberId)

    await prisma.trainerGroupMember.deleteMany({ where: { groupId, memberId } })
    const members = (await prisma.trainerGroupMember.findMany({ where: { groupId }, include: { member: true }, orderBy: { createdAt: "asc" } })).map((entry) => entry.member)
    return { success: true, members, message: "Member removed from trainer group successfully" }
  }, { path: "/api/mobile/trainer/groups/[groupId]/members", method: "DELETE" })
}
