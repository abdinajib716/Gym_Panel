import { NextRequest } from "next/server"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { requireMobileTrainer, scheduleInclude, trainerOwnsMember, workoutInclude } from "@/lib/mobile-trainer"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: Promise<{ memberId: string; resource: string }> }) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const { memberId, resource } = await params
    await trainerOwnsMember(account.trainerId, memberId)
    if (resource === "attendance") return { success: true, attendance: await prisma.attendance.findMany({ where: { memberId }, orderBy: { checkInDate: "desc" } }) }
    if (resource === "workouts") return { success: true, workouts: await prisma.workout.findMany({ where: { trainerId: account.trainerId, memberId }, include: workoutInclude, orderBy: { createdAt: "desc" } }) }
    if (resource === "schedules") return { success: true, schedules: await prisma.trainerSchedule.findMany({ where: { trainerId: account.trainerId, memberId }, include: scheduleInclude, orderBy: { date: "desc" } }) }
    throw new AppError(404, "Resource not found")
  }, { path: "/api/mobile/trainer/members/[memberId]/[resource]", method: "GET" })
}
