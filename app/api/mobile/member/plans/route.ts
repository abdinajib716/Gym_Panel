import { NextRequest } from "next/server"

import { withErrorHandling } from "@/lib/error-handler"
import { requireMobileMember, safePlan } from "@/lib/mobile-member"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    await requireMobileMember(request)
    const plans = await prisma.membershipPlan.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ price: "asc" }, { name: "asc" }],
    })

    return {
      success: true,
      plans: plans.map(safePlan),
    }
  }, { path: "/api/mobile/member/plans", method: "GET" })
}
