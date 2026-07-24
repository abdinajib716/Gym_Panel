import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import { emptyToNull, paginationMeta } from "@/lib/gym-api"
import { prisma } from "@/lib/prisma"
import { safeStoreProduct } from "@/lib/store"
import { gymPaginationQuerySchema } from "@/lib/validations/gym"
import { storeProductSchema } from "@/lib/validations/store"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    await requirePermission("store_products.view")

    const { searchParams } = new URL(request.url)
    const { page, limit, search, status } = gymPaginationQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search") ?? undefined,
      status: searchParams.get("status") ?? undefined,
    })

    const where = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { category: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    } as never

    const [products, total] = await Promise.all([
      prisma.storeProduct.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { orders: true } } },
      }),
      prisma.storeProduct.count({ where }),
    ])
    const soldByProduct = products.length > 0
      ? await prisma.storeOrder.groupBy({
          by: ["productId"],
          where: { productId: { in: products.map((product) => product.id) } },
          _sum: { quantity: true },
        })
      : []
    const soldMap = new Map(soldByProduct.map((entry) => [entry.productId, entry._sum.quantity ?? 0]))

    return {
      products: products.map((product) => ({
        ...safeStoreProduct(product),
        soldQuantity: soldMap.get(product.id) ?? 0,
      })),
      pagination: paginationMeta(total, page, limit),
    }
  }, { path: "/api/v1/store/products", method: "GET" })
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requirePermission("store_products.create")
    const payload = storeProductSchema.parse(await request.json())

    const product = await prisma.storeProduct.create({
      data: {
        name: payload.name,
        category: emptyToNull(payload.category),
        image: emptyToNull(payload.image),
        description: emptyToNull(payload.description),
        price: payload.price,
        availableQuantity: payload.availableQuantity,
        status: payload.status,
      },
    })

    await createActivityLog({
      type: "store",
      activity: "Created store product",
      subject: product.name,
      subjectId: product.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
    })

    return { product: safeStoreProduct(product), message: "Product created successfully" }
  }, { path: "/api/v1/store/products", method: "POST" })
}
