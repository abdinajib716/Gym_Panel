import { NextRequest } from "next/server"

import { requirePermission } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import { dateRangeFilter, paginationMeta } from "@/lib/gym-api"
import { prisma } from "@/lib/prisma"
import { dateRangeFromFilter, safeStoreOrder } from "@/lib/store"
import { gymPaginationQuerySchema } from "@/lib/validations/gym"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    await requirePermission("store_orders.view")

    const { searchParams } = new URL(request.url)
    const { page, limit, search, status, method, dateFrom, dateTo } = gymPaginationQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      method: searchParams.get("method") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
    })
    const period = searchParams.get("period")
    const customDate = searchParams.get("customDate")
    const periodRange = period ? dateRangeFromFilter(period, customDate) : undefined

    const where = {
      ...(status ? { paymentStatus: status } : {}),
      ...(method ? { orderStatus: method } : {}),
      ...(periodRange ? { orderDate: periodRange } : dateFrom || dateTo ? { orderDate: dateRangeFilter(dateFrom, dateTo) } : {}),
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search, mode: "insensitive" as const } },
              { buyerName: { contains: search, mode: "insensitive" as const } },
              { buyerPhoneNumber: { contains: search, mode: "insensitive" as const } },
              { evcTransactionReference: { contains: search, mode: "insensitive" as const } },
              { product: { name: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    } as never

    const [orders, total] = await Promise.all([
      prisma.storeOrder.findMany({
        where,
        orderBy: { orderDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { product: true, member: true, trainer: true },
      }),
      prisma.storeOrder.count({ where }),
    ])

    return {
      orders: orders.map((order) => safeStoreOrder(order)),
      pagination: paginationMeta(total, page, limit),
    }
  }, { path: "/api/v1/store/orders", method: "GET" })
}
