import { NextRequest } from "next/server"
import { withErrorHandling } from "@/lib/error-handler"
import { requireMobileTrainer, trainerOwnsWorkout, validateTrainerTarget, workoutInclude } from "@/lib/mobile-trainer"
import { prisma } from "@/lib/prisma"
import { workoutUpdateSchema } from "@/lib/validations/gym"

export async function GET(request: NextRequest, { params }: { params: Promise<{ workoutId: string }> }) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const { workoutId } = await params
    await trainerOwnsWorkout(account.trainerId, workoutId)
    return { success: true, workout: await prisma.workout.findUniqueOrThrow({ where: { id: workoutId }, include: workoutInclude }) }
  }, { path: "/api/mobile/trainer/workouts/[workoutId]", method: "GET" })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ workoutId: string }> }) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const { workoutId } = await params
    const existing = await trainerOwnsWorkout(account.trainerId, workoutId)
    const payload = workoutUpdateSchema.parse(await request.json())
    const memberId = payload.memberId !== undefined || payload.member_id !== undefined ? payload.memberId || payload.member_id || null : existing.memberId
    const groupId = payload.groupId !== undefined || payload.group_id !== undefined ? payload.groupId || payload.group_id || null : existing.groupId
    await validateTrainerTarget(account.trainerId, memberId, groupId)
    const workout = await prisma.workout.update({ where: { id: workoutId }, data: { title: payload.title, description: payload.description, image: payload.image, sets: payload.sets, reps: payload.reps, durationMinutes: payload.durationMinutes || payload.duration_minutes, difficulty: payload.difficulty, category: payload.category, status: payload.status, memberId, groupId }, include: workoutInclude })
    return { success: true, workout, message: "Workout updated successfully" }
  }, { path: "/api/mobile/trainer/workouts/[workoutId]", method: "PUT" })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ workoutId: string }> }) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const { workoutId } = await params
    await trainerOwnsWorkout(account.trainerId, workoutId)
    await prisma.workout.delete({ where: { id: workoutId } })
    return { success: true, message: "Workout deleted successfully" }
  }, { path: "/api/mobile/trainer/workouts/[workoutId]", method: "DELETE" })
}
