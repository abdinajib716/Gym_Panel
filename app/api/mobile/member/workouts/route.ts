import { NextRequest } from "next/server"
import { withErrorHandling } from "@/lib/error-handler"
import { requireMobileMember } from "@/lib/mobile-member"
import { workoutInclude } from "@/lib/mobile-trainer"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileMember(request)
    const workouts = await prisma.workout.findMany({ where: { status: "ACTIVE", OR: [{ memberId: account.memberId }, { group: { members: { some: { memberId: account.memberId } } } }] }, include: workoutInclude, orderBy: { createdAt: "desc" } })
    return { success: true, workouts }
  }, { path: "/api/mobile/member/workouts", method: "GET" })
}
