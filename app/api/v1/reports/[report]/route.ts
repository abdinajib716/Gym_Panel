import { NextRequest } from "next/server"

import { requirePermission } from "@/lib/auth"
import { dateRangeFilter, paginationMeta } from "@/lib/gym-api"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"
import { gymPaginationQuerySchema } from "@/lib/validations/gym"

export async function GET(request: NextRequest, { params }: { params: Promise<{ report: string }> }) {
  return withErrorHandling(async () => {
    await requirePermission("reports.view")
    const { report } = await params
    const { searchParams } = new URL(request.url)
    const { page, limit, search, status, memberId, dateFrom, dateTo } = gymPaginationQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      memberId: searchParams.get("memberId") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
    })

    const skip = (page - 1) * limit

    if (report === "members") {
      const where = {
        ...(status ? { status } : {}),
        ...(search ? { fullName: { contains: search, mode: "insensitive" as const } } : {}),
      } as never
      const [rows, total] = await Promise.all([
        prisma.member.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit, include: { trainer: true } }),
        prisma.member.count({ where }),
      ])
      return { rows, pagination: paginationMeta(total, page, limit) }
    }

    if (report === "subscriptions") {
      const where = {
        ...(status ? { status } : {}),
        ...(memberId ? { memberId } : {}),
        ...(dateFrom || dateTo ? { createdAt: dateRangeFilter(dateFrom, dateTo) } : {}),
      } as never
      const [rows, total] = await Promise.all([
        prisma.subscription.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit, include: { member: true, plan: true } }),
        prisma.subscription.count({ where }),
      ])
      return { rows, pagination: paginationMeta(total, page, limit) }
    }

    if (report === "payments" || report === "revenue") {
      const where = {
        ...(status ? { status } : {}),
        ...(memberId ? { memberId } : {}),
        ...(dateFrom || dateTo ? { paymentDate: dateRangeFilter(dateFrom, dateTo) } : {}),
      } as never
      const [rows, total, aggregate] = await Promise.all([
        prisma.payment.findMany({ where, orderBy: { paymentDate: "desc" }, skip, take: limit, include: { member: true, plan: true } }),
        prisma.payment.count({ where }),
        prisma.payment.aggregate({ where: { ...(where as object), status: "PAID" } as never, _sum: { amount: true } }),
      ])
      return { rows, totalRevenue: aggregate._sum.amount ?? 0, pagination: paginationMeta(total, page, limit) }
    }

    if (report === "attendance") {
      const where = {
        ...(status ? { status } : {}),
        ...(memberId ? { memberId } : {}),
        ...(dateFrom || dateTo ? { checkInDate: dateRangeFilter(dateFrom, dateTo) } : {}),
      } as never
      const [rows, total] = await Promise.all([
        prisma.attendance.findMany({ where, orderBy: { checkInDate: "desc" }, skip, take: limit, include: { member: true } }),
        prisma.attendance.count({ where }),
      ])
      return { rows, pagination: paginationMeta(total, page, limit) }
    }

    throw new AppError(404, "Report not found")
  }, { path: "/api/v1/reports/[report]", method: "GET" })
}
