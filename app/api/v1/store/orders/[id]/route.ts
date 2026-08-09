import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"
import { safeStoreOrder } from "@/lib/store"
import { storeOrderUpdateSchema } from "@/lib/validations/store"

const orderInclude = {
  product: true,
  member: true,
  trainer: true,
  transaction: true,
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    await requirePermission("store_orders.view")
    const { id } = await params

    const order = await prisma.storeOrder.findUnique({
      where: { id },
      include: orderInclude,
    })

    if (!order) throw new AppError(404, "Order not found")

    return { order: { ...safeStoreOrder(order), transaction: order.transaction } }
  }, { path: "/api/v1/store/orders/[id]", method: "GET" })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await requirePermission("store_orders.update")
    const { id } = await params
    const payload = storeOrderUpdateSchema.parse(await request.json())

    const existingOrder = await prisma.storeOrder.findUnique({ where: { id } })
    if (!existingOrder) throw new AppError(404, "Order not found")

    const order = await prisma.storeOrder.update({
      where: { id },
      data: { orderStatus: payload.orderStatus },
      include: orderInclude,
    })

    await createActivityLog({
      type: "store",
      activity: "Updated store order status",
      subject: order.orderNumber,
      subjectId: order.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
      metadata: { orderStatus: order.orderStatus },
    })

    return { order: safeStoreOrder(order), message: "Order status updated successfully" }
  }, { path: "/api/v1/store/orders/[id]", method: "PUT" })
}
