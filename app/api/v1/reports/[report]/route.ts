import { NextRequest } from "next/server"

import { requirePermission } from "@/lib/auth"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { getReportData, isReportName } from "@/lib/reports"
import { gymPaginationQuerySchema } from "@/lib/validations/gym"

export async function GET(request: NextRequest, { params }: { params: Promise<{ report: string }> }) {
  return withErrorHandling(async () => {
    await requirePermission("reports.view")
    const { report } = await params
    if (!isReportName(report)) throw new AppError(404, "Report not found")

    const { searchParams } = new URL(request.url)
    const filters = gymPaginationQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      memberId: searchParams.get("memberId") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
    })

    return getReportData(report, filters)
  }, { path: "/api/v1/reports/[report]", method: "GET" })
}
