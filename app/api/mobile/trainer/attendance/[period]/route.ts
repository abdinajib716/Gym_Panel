import { NextRequest } from "next/server"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { dayBounds, requireMobileTrainer } from "@/lib/mobile-trainer"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: Promise<{ period: string }> }) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const { period } = await params
    const { start: today, end } = dayBounds()
    const start = new Date(today)
    if (period === "weekly") start.setDate(start.getDate() - 6)
    else if (period === "monthly") start.setDate(start.getDate() - 29)
    else if (period !== "today") throw new AppError(404, "Attendance period not found")
    const attendance = await prisma.attendance.findMany({ where: { member: { trainerId: account.trainerId }, checkInDate: { gte: start, lt: end } }, include: { member: { select: { id: true, fullName: true, phoneNumber: true } } }, orderBy: { checkInDate: "desc" } })
    return { success: true, period, summary: { total: attendance.length, present: attendance.filter((entry) => entry.status === "PRESENT").length, cancelled: attendance.filter((entry) => entry.status === "CANCELLED").length }, attendance }
  }, { path: "/api/mobile/trainer/attendance/[period]", method: "GET" })
}
