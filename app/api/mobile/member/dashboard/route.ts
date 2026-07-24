import { NextRequest } from "next/server"

import { withErrorHandling } from "@/lib/error-handler"
import { requireMobileMember, safeNotification, safePayment, safeSubscription } from "@/lib/mobile-member"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileMember(request)
    const memberId = account.memberId
    const today = new Date()

    const [currentSubscription, paymentCount, unreadNotifications, recentPayments, latestNotifications] = await Promise.all([
      prisma.subscription.findFirst({
        where: {
          memberId,
          status: "ACTIVE",
          expiryDate: { gte: today },
        },
        include: { plan: true },
        orderBy: { expiryDate: "desc" },
      }),
      prisma.payment.count({ where: { memberId } }),
      prisma.notification.count({ where: { memberId, readStatus: "UNREAD" } }),
      prisma.payment.findMany({
        where: { memberId },
        include: { plan: true, subscription: { include: { plan: true } } },
        orderBy: { paymentDate: "desc" },
        take: 5,
      }),
      prisma.notification.findMany({
        where: { memberId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ])

    return {
      success: true,
      member: {
        id: account.member.id,
        fullName: account.member.fullName,
        phoneNumber: account.member.phoneNumber,
        email: account.member.email,
        profileImage: account.member.profileImage,
        status: account.member.status,
      },
      account: {
        accountId: account.id,
        mustChangePassword: account.mustChangePassword,
      },
      summary: {
        hasActiveSubscription: Boolean(currentSubscription),
        paymentCount,
        unreadNotifications,
      },
      currentSubscription: currentSubscription ? safeSubscription(currentSubscription) : null,
      recentPayments: recentPayments.map(safePayment),
      latestNotifications: latestNotifications.map(safeNotification),
    }
  }, { path: "/api/mobile/member/dashboard", method: "GET" })
}
