import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { emptyToNull } from "@/lib/gym-api"
import { prisma } from "@/lib/prisma"
import { safeStoreProduct } from "@/lib/store"
import { storeProductUpdateSchema } from "@/lib/validations/store"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    await requirePermission("store_products.view")
    const { id } = await params

    const [product, sold] = await Promise.all([
      prisma.storeProduct.findUnique({
        where: { id },
        include: {
          orders: { orderBy: { orderDate: "desc" }, take: 10 },
          transactions: { orderBy: { transactionDate: "desc" }, take: 10 },
          _count: { select: { orders: true } },
        },
      }),
      prisma.storeOrder.aggregate({
        where: { productId: id },
        _sum: { quantity: true },
      }),
    ])

    if (!product) throw new AppError(404, "Product not found")

    return {
      product: {
        ...safeStoreProduct(product),
        soldQuantity: sold._sum.quantity ?? 0,
        orders: product.orders,
        transactions: product.transactions,
        _count: product._count,
      },
    }
  }, { path: "/api/v1/store/products/[id]", method: "GET" })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await requirePermission("store_products.update")
    const { id } = await params
    const payload = storeProductUpdateSchema.parse(await request.json())

    const existingProduct = await prisma.storeProduct.findUnique({ where: { id } })
    if (!existingProduct) throw new AppError(404, "Product not found")

    const product = await prisma.storeProduct.update({
      where: { id },
      data: {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.category !== undefined ? { category: emptyToNull(payload.category) } : {}),
        ...(payload.image !== undefined ? { image: emptyToNull(payload.image) } : {}),
        ...(payload.description !== undefined ? { description: emptyToNull(payload.description) } : {}),
        ...(payload.price !== undefined ? { price: payload.price } : {}),
        ...(payload.availableQuantity !== undefined ? { availableQuantity: payload.availableQuantity } : {}),
        ...(payload.status !== undefined ? { status: payload.status } : {}),
      },
    })

    await createActivityLog({
      type: "store",
      activity: "Updated store product",
      subject: product.name,
      subjectId: product.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
    })

    return { product: safeStoreProduct(product), message: "Product updated successfully" }
  }, { path: "/api/v1/store/products/[id]", method: "PUT" })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await requirePermission("store_products.delete")
    const { id } = await params

    const existingProduct = await prisma.storeProduct.findUnique({
      where: { id },
      include: { _count: { select: { orders: true, transactions: true } } },
    })
    if (!existingProduct) throw new AppError(404, "Product not found")
    if (existingProduct._count.orders > 0 || existingProduct._count.transactions > 0) {
      throw new AppError(400, "Products with orders or transactions cannot be deleted. Unpublish it instead.")
    }

    await prisma.storeProduct.delete({ where: { id } })

    await createActivityLog({
      type: "store",
      activity: "Deleted store product",
      subject: existingProduct.name,
      subjectId: existingProduct.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
    })

    return { success: true, message: "Product deleted successfully" }
  }, { path: "/api/v1/store/products/[id]", method: "DELETE" })
}
