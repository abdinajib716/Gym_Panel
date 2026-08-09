import { NextRequest } from "next/server"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { requireMobileMember } from "@/lib/mobile-member"
import { workoutInclude } from "@/lib/mobile-trainer"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: Promise<{ workoutId: string }> }) {
  return withErrorHandling(async () => {
    const account = await requireMobileMember(request)
    const { workoutId } = await params
    const workout = await prisma.workout.findFirst({ where: { id: workoutId, OR: [{ memberId: account.memberId }, { group: { members: { some: { memberId: account.memberId } } } }] }, include: workoutInclude })
    if (!workout) throw new AppError(404, "Workout not found")
    return { success: true, workout }
  }, { path: "/api/mobile/member/workouts/[workoutId]", method: "GET" })
}
