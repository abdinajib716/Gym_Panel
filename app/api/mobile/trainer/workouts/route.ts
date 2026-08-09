import { NextRequest } from "next/server"
import { withErrorHandling } from "@/lib/error-handler"
import { notifyMember, requireMobileTrainer, targetMemberIds, validateTrainerTarget, workoutInclude } from "@/lib/mobile-trainer"
import { prisma } from "@/lib/prisma"
import { workoutSchema } from "@/lib/validations/gym"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const workouts = await prisma.workout.findMany({ where: { trainerId: account.trainerId }, include: workoutInclude, orderBy: { createdAt: "desc" } })
    return { success: true, workouts }
  }, { path: "/api/mobile/trainer/workouts", method: "GET" })
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const payload = workoutSchema.parse(await request.json())
    const memberId = payload.memberId || payload.member_id || null
    const groupId = payload.groupId || payload.group_id || null
    await validateTrainerTarget(account.trainerId, memberId, groupId)
    const workout = await prisma.workout.create({
      data: { trainerId: account.trainerId, memberId, groupId, title: payload.title, description: payload.description || null, image: payload.image || null, sets: payload.sets, reps: payload.reps, durationMinutes: payload.durationMinutes || payload.duration_minutes, difficulty: payload.difficulty, category: payload.category || null, status: payload.status },
      include: workoutInclude,
    })
    const memberIds = await targetMemberIds(memberId, groupId)
    await Promise.all(memberIds.map((id) => notifyMember(id, `New workout assigned: ${workout.title}`, `${account.trainer.fullName} assigned a new workout to you.`, "WORKOUT_ASSIGNED")))
    return { success: true, workout, message: "Workout created and assigned successfully" }
  }, { path: "/api/mobile/trainer/workouts", method: "POST" })
}
