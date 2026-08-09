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

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

export async function GET() {
  return withErrorHandling(async () => {
    await requirePermission("members.view")

    const today = startOfToday()
    const monthStart = startOfMonth()
    const nextThirtyDays = new Date()
    nextThirtyDays.setDate(nextThirtyDays.getDate() + 30)
    const trendStart = startOfToday()
    trendStart.setDate(trendStart.getDate() - 6)

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
      paidPaymentsForTrend,
      attendanceForTrend,
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
      prisma.payment.findMany({
        where: { status: "PAID", paymentDate: { gte: trendStart } },
        select: { paymentDate: true, amount: true },
      }),
      prisma.attendance.findMany({
        where: { status: "PRESENT", checkInDate: { gte: trendStart } },
        select: { checkInDate: true },
      }),
    ])

    const revenueByDay = new Map<string, number>()
    for (const payment of paidPaymentsForTrend) {
      const key = dayKey(payment.paymentDate)
      revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + Number(payment.amount))
    }
    const attendanceByDay = new Map<string, number>()
    for (const attendance of attendanceForTrend) {
      const key = dayKey(attendance.checkInDate)
      attendanceByDay.set(key, (attendanceByDay.get(key) ?? 0) + 1)
    }
    const weekday = new Intl.DateTimeFormat("en", { weekday: "short" })
    const weeklyTrend = Array.from({ length: 7 }, (_, offset) => {
      const date = new Date(trendStart)
      date.setDate(trendStart.getDate() + offset)
      const key = dayKey(date)
      return { day: weekday.format(date), revenue: revenueByDay.get(key) ?? 0, attendance: attendanceByDay.get(key) ?? 0 }
    })

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
      charts: { weeklyRevenue: weeklyTrend, weeklyAttendance: weeklyTrend },
    }
  }, { path: "/api/v1/dashboard", method: "GET" })
}
