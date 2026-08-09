import { NextRequest } from "next/server"

import { withErrorHandling } from "@/lib/error-handler"
import { requireMobileMember, safePayment } from "@/lib/mobile-member"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileMember(request)
    const payments = await prisma.payment.findMany({
      where: { memberId: account.memberId },
      include: { plan: true, subscription: { include: { plan: true } } },
      orderBy: { paymentDate: "desc" },
    })

    return {
      success: true,
      payments: payments.map(safePayment),
    }
  }, { path: "/api/mobile/member/payments/history", method: "GET" })
}
