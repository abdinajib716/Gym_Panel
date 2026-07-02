import { NextRequest } from "next/server"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { notifyMember, requireMobileTrainer, targetMemberIds, trainerOwnsGroup, trainerOwnsMember, trainerOwnsWorkout, workoutInclude } from "@/lib/mobile-trainer"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: Promise<{ workoutId: string; action: string }> }) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const { workoutId, action } = await params
    const existing = await trainerOwnsWorkout(account.trainerId, workoutId)
    const payload = await request.json().catch(() => ({})) as { memberId?: string; member_id?: string; groupId?: string; group_id?: string }
    let memberId: string | null = null
    let groupId: string | null = null
    if (action === "assign-member") { memberId = payload.memberId || payload.member_id || ""; await trainerOwnsMember(account.trainerId, memberId) }
    else if (action === "assign-group") { groupId = payload.groupId || payload.group_id || ""; await trainerOwnsGroup(account.trainerId, groupId) }
    else throw new AppError(404, "Workout action not found")
    const workout = await prisma.workout.update({ where: { id: workoutId }, data: { memberId, groupId }, include: workoutInclude })
    const memberIds = await targetMemberIds(memberId, groupId)
    await Promise.all(memberIds.map((id) => notifyMember(id, `New workout assigned: ${existing.title}`, `${account.trainer.fullName} assigned a new workout to you.`, "WORKOUT_ASSIGNED")))
    return { success: true, workout, message: "Workout assigned successfully" }
  }, { path: "/api/mobile/trainer/workouts/[workoutId]/[action]", method: "POST" })
}
