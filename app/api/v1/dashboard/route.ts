import { requirePermission } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function startOfMonth() {
  const date = new Date()
  date.setDate(1)
  date.setHours(0, 0, 0, 0)
  return date
}

export async function GET() {
  return withErrorHandling(async () => {
    await requirePermission("members.view")

    const today = startOfToday()
    const monthStart = startOfMonth()
    const nextThirtyDays = new Date()
    nextThirtyDays.setDate(nextThirtyDays.getDate() + 30)

    const [
      totalMembers,
      activeSubscriptions,
      expiredSubscriptions,
      pendingPayments,
      todayAttendance,
      monthlyRevenue,
      totalTrainers,
      recentNotifications,
      recentMembers,
      recentPayments,
      expiringSubscriptions,
      todayAttendanceRows,
    ] = await Promise.all([
      prisma.member.count(),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.subscription.count({ where: { status: "EXPIRED" } }),
      prisma.payment.count({ where: { status: "PENDING" } }),
      prisma.attendance.count({ where: { checkInDate: { gte: today }, status: "PRESENT" } }),
      prisma.payment.aggregate({
        where: { status: "PAID", paymentDate: { gte: monthStart } },
        _sum: { amount: true },
      }),
      prisma.trainer.count(),
      prisma.notification.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.member.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { subscriptions: { include: { plan: true }, take: 1, orderBy: { createdAt: "desc" } } } }),
      prisma.payment.findMany({ orderBy: { paymentDate: "desc" }, take: 5, include: { member: true, plan: true } }),
      prisma.subscription.findMany({
        where: { status: "ACTIVE", expiryDate: { gte: today, lte: nextThirtyDays } },
        orderBy: { expiryDate: "asc" },
        take: 5,
        include: { member: true, plan: true },
      }),
      prisma.attendance.findMany({
        where: { checkInDate: { gte: today } },
        orderBy: { checkInDate: "desc" },
        take: 5,
        include: { member: true },
      }),
    ])

    return {
      stats: {
        totalMembers,
        activeSubscriptions,
        expiredSubscriptions,
        pendingPayments,
        todayAttendance,
        monthlyRevenue: monthlyRevenue._sum.amount ?? 0,
        totalTrainers,
        recentNotifications,
      },
      recentMembers,
      recentPayments,
      expiringSubscriptions,
      todayAttendance: todayAttendanceRows,
    }
  }, { path: "/api/v1/dashboard", method: "GET" })
}
