import { NextRequest } from "next/server"
import { withErrorHandling } from "@/lib/error-handler"
import { requireMobileTrainer, trainerOwnsMember } from "@/lib/mobile-trainer"
import { prisma } from "@/lib/prisma"
import { trainerGroupSchema } from "@/lib/validations/gym"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const groups = await prisma.trainerGroup.findMany({ where: { trainerId: account.trainerId }, include: { _count: { select: { members: true, workouts: true, schedules: true } } }, orderBy: { name: "asc" } })
    return { success: true, groups }
  }, { path: "/api/mobile/trainer/groups", method: "GET" })
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const payload = trainerGroupSchema.parse(await request.json())
    const memberIds = Array.from(new Set([...(payload.memberIds || []), ...(payload.member_ids || [])]))

    await Promise.all(memberIds.map((memberId) => trainerOwnsMember(account.trainerId, memberId)))

    const group = await prisma.trainerGroup.create({
      data: {
        name: payload.name,
        trainingDays: payload.trainingDays || payload.training_days || null,
        trainingTime: payload.trainingTime || payload.training_time || null,
        status: payload.status,
        trainerId: account.trainerId,
        members: {
          create: memberIds.map((memberId) => ({ memberId })),
        },
      },
      include: { members: { include: { member: true } }, _count: { select: { members: true, workouts: true, schedules: true } } },
    })

    return { success: true, group, message: "Trainer group created successfully" }
  }, { path: "/api/mobile/trainer/groups", method: "POST" })
}
