import { NextRequest } from "next/server"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { notifyMember, requireMobileTrainer, scheduleInclude, targetMemberIds, trainerOwnsWorkout, validateTrainerTarget } from "@/lib/mobile-trainer"
import { prisma } from "@/lib/prisma"
import { trainerScheduleSchema } from "@/lib/validations/gym"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const params = new URL(request.url).searchParams
    const date = params.get("date")
    const schedules = await prisma.trainerSchedule.findMany({ where: { trainerId: account.trainerId, ...(date ? { date: new Date(date) } : {}) }, include: scheduleInclude, orderBy: [{ date: "asc" }, { startTime: "asc" }] })
    return { success: true, schedules }
  }, { path: "/api/mobile/trainer/schedules", method: "GET" })
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const payload = trainerScheduleSchema.parse(await request.json())
    const memberId = payload.memberId || payload.member_id || null
    const groupId = payload.groupId || payload.group_id || null
    const workoutId = payload.workoutId || payload.workout_id
    const startTime = payload.startTime || payload.start_time
    const endTime = payload.endTime || payload.end_time
    if (!workoutId || !startTime || !endTime) throw new AppError(400, "Workout, start time, and end time are required")
    await validateTrainerTarget(account.trainerId, memberId, groupId)
    const workout = await trainerOwnsWorkout(account.trainerId, workoutId)
    const schedule = await prisma.trainerSchedule.create({ data: { trainerId: account.trainerId, memberId, groupId, workoutId, date: new Date(payload.date), startTime, endTime, notes: payload.notes || null, status: payload.status }, include: scheduleInclude })
    const memberIds = await targetMemberIds(memberId, groupId)
    await Promise.all(memberIds.map((id) => notifyMember(id, "New training schedule", `${workout.title} is scheduled for ${payload.date} at ${startTime}.`, "SCHEDULE_ASSIGNED")))
    return { success: true, schedule, message: "Schedule created successfully" }
  }, { path: "/api/mobile/trainer/schedules", method: "POST" })
}
