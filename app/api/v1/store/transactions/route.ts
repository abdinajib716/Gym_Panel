import { NextRequest } from "next/server"

import { requirePermission } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import { dateRangeFilter, paginationMeta } from "@/lib/gym-api"
import { prisma } from "@/lib/prisma"
import { dateRangeFromFilter, safeStoreTransaction } from "@/lib/store"
import { gymPaginationQuerySchema } from "@/lib/validations/gym"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    await requirePermission("store_transactions.view")

    const { searchParams } = new URL(request.url)
    const { page, limit, search, status, dateFrom, dateTo } = gymPaginationQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
    })
    const period = searchParams.get("period")
    const customDate = searchParams.get("customDate")
    const periodRange = period ? dateRangeFromFilter(period, customDate) : undefined

    const where = {
      ...(status ? { paymentStatus: status } : {}),
      ...(periodRange ? { transactionDate: periodRange } : dateFrom || dateTo ? { transactionDate: dateRangeFilter(dateFrom, dateTo) } : {}),
      ...(search
        ? {
            OR: [
              { transactionReference: { contains: search, mode: "insensitive" as const } },
              { orderNumber: { contains: search, mode: "insensitive" as const } },
              { buyerName: { contains: search, mode: "insensitive" as const } },
              { phoneNumber: { contains: search, mode: "insensitive" as const } },
              { requestId: { contains: search, mode: "insensitive" as const } },
              { product: { name: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    } as never

    const [transactions, total] = await Promise.all([
      prisma.storeTransaction.findMany({
        where,
        orderBy: { transactionDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { product: true, order: true, member: true, trainer: true },
      }),
      prisma.storeTransaction.count({ where }),
    ])

    return {
      transactions: transactions.map((transaction) => safeStoreTransaction(transaction)),
      pagination: paginationMeta(total, page, limit),
    }
  }, { path: "/api/v1/store/transactions", method: "GET" })
}
