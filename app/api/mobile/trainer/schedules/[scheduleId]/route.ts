import { NextRequest } from "next/server"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { requireMobileTrainer, scheduleInclude, trainerOwnsSchedule, trainerOwnsWorkout, validateTrainerTarget } from "@/lib/mobile-trainer"
import { prisma } from "@/lib/prisma"
import { trainerScheduleUpdateSchema } from "@/lib/validations/gym"

export async function GET(request: NextRequest, { params }: { params: Promise<{ scheduleId: string }> }) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const { scheduleId } = await params
    await trainerOwnsSchedule(account.trainerId, scheduleId)
    return { success: true, schedule: await prisma.trainerSchedule.findUniqueOrThrow({ where: { id: scheduleId }, include: scheduleInclude }) }
  }, { path: "/api/mobile/trainer/schedules/[scheduleId]", method: "GET" })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ scheduleId: string }> }) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const { scheduleId } = await params
    const existing = await trainerOwnsSchedule(account.trainerId, scheduleId)
    const payload = trainerScheduleUpdateSchema.parse(await request.json())
    const memberId = payload.memberId !== undefined || payload.member_id !== undefined ? payload.memberId || payload.member_id || null : existing.memberId
    const groupId = payload.groupId !== undefined || payload.group_id !== undefined ? payload.groupId || payload.group_id || null : existing.groupId
    const workoutId = payload.workoutId || payload.workout_id || existing.workoutId
    await validateTrainerTarget(account.trainerId, memberId, groupId)
    await trainerOwnsWorkout(account.trainerId, workoutId)
    const date = payload.date ? new Date(payload.date) : existing.date
    if (Number.isNaN(date.getTime())) throw new AppError(400, "Invalid schedule date")
    const schedule = await prisma.trainerSchedule.update({ where: { id: scheduleId }, data: { memberId, groupId, workoutId, date, startTime: payload.startTime || payload.start_time, endTime: payload.endTime || payload.end_time, notes: payload.notes, status: payload.status }, include: scheduleInclude })
    return { success: true, schedule, message: "Schedule updated successfully" }
  }, { path: "/api/mobile/trainer/schedules/[scheduleId]", method: "PUT" })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ scheduleId: string }> }) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const { scheduleId } = await params
    await trainerOwnsSchedule(account.trainerId, scheduleId)
    await prisma.trainerSchedule.delete({ where: { id: scheduleId } })
    return { success: true, message: "Schedule deleted successfully" }
  }, { path: "/api/mobile/trainer/schedules/[scheduleId]", method: "DELETE" })
}
