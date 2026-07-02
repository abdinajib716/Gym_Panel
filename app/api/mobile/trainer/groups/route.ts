import { NextRequest } from "next/server"
import { withErrorHandling } from "@/lib/error-handler"
import { requireMobileTrainer } from "@/lib/mobile-trainer"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const groups = await prisma.trainerGroup.findMany({ where: { trainerId: account.trainerId }, include: { _count: { select: { members: true, workouts: true, schedules: true } } }, orderBy: { name: "asc" } })
    return { success: true, groups }
  }, { path: "/api/mobile/trainer/groups", method: "GET" })
}
