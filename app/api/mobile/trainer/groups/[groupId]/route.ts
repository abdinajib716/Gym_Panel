import { NextRequest } from "next/server"
import { withErrorHandling } from "@/lib/error-handler"
import { requireMobileTrainer, trainerOwnsGroup } from "@/lib/mobile-trainer"
import { prisma } from "@/lib/prisma"
import { trainerGroupUpdateSchema } from "@/lib/validations/gym"

export async function GET(request: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const { groupId } = await params
    await trainerOwnsGroup(account.trainerId, groupId)
    const group = await prisma.trainerGroup.findUniqueOrThrow({ where: { id: groupId }, include: { members: { include: { member: true } }, workouts: true, schedules: { include: { workout: true }, orderBy: { date: "desc" } } } })
    return { success: true, group }
  }, { path: "/api/mobile/trainer/groups/[groupId]", method: "GET" })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const { groupId } = await params
    await trainerOwnsGroup(account.trainerId, groupId)
    const payload = trainerGroupUpdateSchema.parse(await request.json())

    const group = await prisma.trainerGroup.update({
      where: { id: groupId },
      data: {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.trainingDays !== undefined || payload.training_days !== undefined ? { trainingDays: payload.trainingDays || payload.training_days || null } : {}),
        ...(payload.trainingTime !== undefined || payload.training_time !== undefined ? { trainingTime: payload.trainingTime || payload.training_time || null } : {}),
        ...(payload.status !== undefined ? { status: payload.status } : {}),
      },
      include: { members: { include: { member: true } }, workouts: true, schedules: { include: { workout: true }, orderBy: { date: "desc" } } },
    })

    return { success: true, group, message: "Trainer group updated successfully" }
  }, { path: "/api/mobile/trainer/groups/[groupId]", method: "PUT" })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const { groupId } = await params
    await trainerOwnsGroup(account.trainerId, groupId)

    await prisma.trainerGroup.delete({ where: { id: groupId } })

    return { success: true, message: "Trainer group deleted successfully" }
  }, { path: "/api/mobile/trainer/groups/[groupId]", method: "DELETE" })
}
