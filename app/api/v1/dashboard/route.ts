import { requirePermission } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"

const DASHBOARD_TIME_ZONE = "Africa/Mogadishu"

function dateKeyInDashboardTimeZone(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DASHBOARD_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function startOfToday() {
  return new Date(`${dateKeyInDashboardTimeZone(new Date())}T00:00:00+03:00`)
}

function startOfMonth() {
  const todayKey = dateKeyInDashboardTimeZone(new Date())
  return new Date(`${todayKey.slice(0, 8)}01T00:00:00+03:00`)
}

function valuesByDay(rows: Array<{ date: Date }>) {
  const values = new Map<string, number>()
  for (const row of rows) {
    const key = dateKeyInDashboardTimeZone(row.date)
    values.set(key, (values.get(key) ?? 0) + 1)
  }
  return values
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
      newMembersForTrend,
      activeSubscriptionsForTrend,
      expiredSubscriptionsForTrend,
      pendingPaymentsForTrend,
      newTrainersForTrend,
      notificationsForTrend,
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
      prisma.member.findMany({ where: { createdAt: { gte: trendStart } }, select: { createdAt: true } }),
      prisma.subscription.findMany({ where: { status: "ACTIVE" }, select: { startDate: true, expiryDate: true } }),
      prisma.subscription.findMany({ where: { status: "EXPIRED", expiryDate: { gte: trendStart } }, select: { expiryDate: true } }),
      prisma.payment.findMany({ where: { status: "PENDING", createdAt: { gte: trendStart } }, select: { createdAt: true } }),
      prisma.trainer.findMany({ where: { createdAt: { gte: trendStart } }, select: { createdAt: true } }),
      prisma.notification.findMany({ where: { createdAt: { gte: trendStart } }, select: { createdAt: true } }),
    ])

    const revenueByDay = new Map<string, number>()
    for (const payment of paidPaymentsForTrend) {
      const key = dateKeyInDashboardTimeZone(payment.paymentDate)
      revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + Number(payment.amount))
    }
    const attendanceByDay = new Map<string, number>()
    for (const attendance of attendanceForTrend) {
      const key = dateKeyInDashboardTimeZone(attendance.checkInDate)
      attendanceByDay.set(key, (attendanceByDay.get(key) ?? 0) + 1)
    }
    const weekday = new Intl.DateTimeFormat("en", { weekday: "short", timeZone: DASHBOARD_TIME_ZONE })
    const trendDates = Array.from({ length: 7 }, (_, offset) => {
      const date = new Date(trendStart)
      date.setUTCDate(trendStart.getUTCDate() + offset)
      return { date, key: dateKeyInDashboardTimeZone(date), day: weekday.format(date) }
    })
    const weeklyRevenue = trendDates.map(({ day, key }) => ({ day, revenue: revenueByDay.get(key) ?? 0 }))
    const weeklyAttendance = trendDates.map(({ day, key }) => ({ day, attendance: attendanceByDay.get(key) ?? 0 }))
    const memberByDay = valuesByDay(newMembersForTrend.map((row) => ({ date: row.createdAt })))
    const pendingPaymentByDay = valuesByDay(pendingPaymentsForTrend.map((row) => ({ date: row.createdAt })))
    const trainerByDay = valuesByDay(newTrainersForTrend.map((row) => ({ date: row.createdAt })))
    const notificationByDay = valuesByDay(notificationsForTrend.map((row) => ({ date: row.createdAt })))
    const expiredByDay = valuesByDay(expiredSubscriptionsForTrend.map((row) => ({ date: row.expiryDate })))
    const cumulativeTrend = (currentTotal: number, byDay: Map<string, number>) => {
      let running = currentTotal - Array.from(byDay.values()).reduce((total, value) => total + value, 0)
      return trendDates.map(({ key }) => {
        running += byDay.get(key) ?? 0
        return running
      })
    }
    const cardTrends = {
      totalMembers: cumulativeTrend(totalMembers, memberByDay),
      activeSubscriptions: trendDates.map(({ key }) => activeSubscriptionsForTrend.filter((subscription) => dateKeyInDashboardTimeZone(subscription.startDate) <= key && dateKeyInDashboardTimeZone(subscription.expiryDate) >= key).length),
      expiredSubscriptions: cumulativeTrend(expiredSubscriptions, expiredByDay),
      pendingPayments: cumulativeTrend(pendingPayments, pendingPaymentByDay),
      todayAttendance: weeklyAttendance.map((point) => point.attendance),
      monthlyRevenue: weeklyRevenue.map((point) => point.revenue),
      totalTrainers: cumulativeTrend(totalTrainers, trainerByDay),
      recentNotifications: cumulativeTrend(recentNotifications, notificationByDay),
    }

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
      charts: { weeklyRevenue, weeklyAttendance, cardTrends },
    }
  }, { path: "/api/v1/dashboard", method: "GET" })
}
