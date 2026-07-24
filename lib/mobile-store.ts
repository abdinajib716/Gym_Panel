import { NextRequest } from "next/server"

import { AppError } from "@/lib/error-handler"
import { requireMobileMember } from "@/lib/mobile-member"
import { requireMobileTrainer } from "@/lib/mobile-trainer"
import { prisma } from "@/lib/prisma"
import { initiateStoreWaafiPurchase, safeStoreOrder, safeStoreProduct, safeStoreTransaction, type StoreBuyer } from "@/lib/store"
import { mobileStorePurchaseSchema } from "@/lib/validations/store"

export async function requireStoreBuyer(request: NextRequest, role: "MEMBER" | "TRAINER"): Promise<StoreBuyer> {
  if (role === "MEMBER") {
    const account = await requireMobileMember(request)
    return {
      type: "MEMBER",
      id: account.memberId,
      name: account.member.fullName,
      phoneNumber: account.member.phoneNumber,
      email: account.loginEmail,
    }
  }

  const account = await requireMobileTrainer(request)
  return {
    type: "TRAINER",
    id: account.trainerId,
    name: account.trainer.fullName,
    phoneNumber: account.trainer.phoneNumber,
    email: account.loginEmail,
  }
}

export async function listMobileStoreProducts() {
  const products = await prisma.storeProduct.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ availableQuantity: "desc" }, { createdAt: "desc" }],
  })

  return products.map(safeStoreProduct)
}

export async function getMobileStoreProduct(productId: string) {
  const product = await prisma.storeProduct.findFirst({
    where: { id: productId, status: "PUBLISHED" },
  })
  if (!product) throw new AppError(404, "Product not found")
  return safeStoreProduct(product)
}

export async function purchaseMobileStoreProduct(request: NextRequest, role: "MEMBER" | "TRAINER", productId: string) {
  const buyer = await requireStoreBuyer(request, role)
  const payload = mobileStorePurchaseSchema.parse(await request.json().catch(() => ({})))

  const result = await initiateStoreWaafiPurchase({
    buyer,
    productId,
    quantity: payload.quantity,
    phoneNumber: payload.phoneNumber,
    provider: payload.provider,
    currency: payload.currency,
  })

  return {
    success: true,
    paymentStatus: result.paymentStatus,
    message: result.order
      ? "Payment confirmed and order created successfully"
      : "Payment was not completed. Order was not created.",
    product: safeStoreProduct(result.product),
    order: result.order ? safeStoreOrder(result.order) : null,
    transaction: result.transaction ? safeStoreTransaction(result.transaction) : null,
  }
}

export async function listMobileStoreOrders(request: NextRequest, role: "MEMBER" | "TRAINER") {
  const buyer = await requireStoreBuyer(request, role)
  const orders = await prisma.storeOrder.findMany({
    where: buyer.type === "MEMBER" ? { memberId: buyer.id } : { trainerId: buyer.id },
    orderBy: { orderDate: "desc" },
    include: { product: true },
  })

  return orders.map(safeStoreOrder)
}

export async function getMobileStoreOrder(request: NextRequest, role: "MEMBER" | "TRAINER", orderId: string) {
  const buyer = await requireStoreBuyer(request, role)
  const order = await prisma.storeOrder.findFirst({
    where: {
      id: orderId,
      ...(buyer.type === "MEMBER" ? { memberId: buyer.id } : { trainerId: buyer.id }),
    },
    include: { product: true, transaction: true },
  })

  if (!order) throw new AppError(404, "Order not found")
  return { ...safeStoreOrder(order), transaction: order.transaction }
}
