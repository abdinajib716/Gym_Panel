import { NextRequest } from "next/server"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { requireMobileTrainer, scheduleInclude, trainerOwnsSchedule } from "@/lib/mobile-trainer"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: Promise<{ scheduleId: string; action: string }> }) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const { scheduleId, action } = await params
    await trainerOwnsSchedule(account.trainerId, scheduleId)
    const status = action === "complete" ? "COMPLETED" : action === "cancel" ? "CANCELLED" : null
    if (!status) throw new AppError(404, "Schedule action not found")
    const schedule = await prisma.trainerSchedule.update({ where: { id: scheduleId }, data: { status }, include: scheduleInclude })
    return { success: true, schedule, message: `Schedule marked ${status.toLowerCase()}` }
  }, { path: "/api/mobile/trainer/schedules/[scheduleId]/[action]", method: "POST" })
}
