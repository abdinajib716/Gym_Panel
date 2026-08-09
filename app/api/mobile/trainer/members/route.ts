import { NextRequest } from "next/server"
import { withErrorHandling } from "@/lib/error-handler"
import { requireMobileTrainer } from "@/lib/mobile-trainer"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const search = new URL(request.url).searchParams.get("search") || ""
    const members = await prisma.member.findMany({
      where: { trainerId: account.trainerId, ...(search ? { OR: [{ fullName: { contains: search, mode: "insensitive" } }, { phoneNumber: { contains: search } }] } : {}) },
      include: { subscriptions: { orderBy: { createdAt: "desc" }, take: 1, include: { plan: true } }, _count: { select: { attendance: true, workouts: true, trainerSchedules: true } } },
      orderBy: { fullName: "asc" },
    })
    return { success: true, members }
  }, { path: "/api/mobile/trainer/members", method: "GET" })
}
