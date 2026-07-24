import { createActivityLog } from "@/lib/access-control"
import { AppError } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"
import {
  buildWaafiPayload,
  buildWaafiRequestId,
  getWaafiConfig,
  getWaafiOrderId,
  getWaafiResponseId,
  getWaafiResponseMessage,
  mapWaafiStatus,
  normalizeSomaliaPhoneNumber,
  sendWaafiPaymentRequest,
  validateWaafiConfig,
  type WaafiProvider,
} from "@/lib/payments/waafi.service"

export type StoreBuyer = {
  type: "MEMBER" | "TRAINER"
  id: string
  name: string
  phoneNumber: string
  email?: string | null
}

export function toStoreNumber(value: unknown) {
  if (value === null || value === undefined) return 0
  return Number(value)
}

export function safeStoreProduct(product: {
  id: string
  name: string
  category?: string | null
  image?: string | null
  description?: string | null
  price: unknown
  availableQuantity: number
  status: string
  createdAt?: Date
  updatedAt?: Date
}) {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    image: product.image,
    description: product.description,
    price: toStoreNumber(product.price),
    currency: "USD",
    availableQuantity: product.availableQuantity,
    isOutOfStock: product.availableQuantity <= 0,
    status: product.status,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }
}

export function safeStoreOrder(order: {
  id: string
  orderNumber: string
  buyerName: string
  buyerType: string
  buyerPhoneNumber: string
  quantity: number
  unitPrice: unknown
  totalAmount: unknown
  currency: string
  paymentMethod: string
  onlineProvider?: string | null
  evcTransactionReference?: string | null
  paymentStatus: string
  orderStatus: string
  orderDate: Date
  paidAt?: Date | null
  product?: Parameters<typeof safeStoreProduct>[0] | null
}) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    buyerName: order.buyerName,
    buyerType: order.buyerType,
    buyerPhoneNumber: order.buyerPhoneNumber,
    product: order.product ? safeStoreProduct(order.product) : null,
    quantity: order.quantity,
    unitPrice: toStoreNumber(order.unitPrice),
    totalAmount: toStoreNumber(order.totalAmount),
    currency: order.currency,
    paymentMethod: order.paymentMethod,
    provider: order.onlineProvider,
    evcTransactionReference: order.evcTransactionReference,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    orderDate: order.orderDate,
    paidAt: order.paidAt,
  }
}

export function safeStoreTransaction(transaction: {
  id: string
  transactionReference?: string | null
  orderNumber?: string | null
  buyerName: string
  buyerType: string
  phoneNumber: string
  quantity: number
  amount: unknown
  currency: string
  paymentMethod: string
  provider?: string | null
  paymentStatus: string
  requestId: string
  referenceId?: string | null
  invoiceId?: string | null
  failedReason?: string | null
  transactionDate: Date
  product?: Parameters<typeof safeStoreProduct>[0] | null
  order?: { id: string; orderNumber: string } | null
}) {
  return {
    id: transaction.id,
    transactionReference: transaction.transactionReference,
    orderNumber: transaction.orderNumber ?? transaction.order?.orderNumber ?? null,
    buyerName: transaction.buyerName,
    buyerType: transaction.buyerType,
    phoneNumber: transaction.phoneNumber,
    product: transaction.product ? safeStoreProduct(transaction.product) : null,
    quantity: transaction.quantity,
    amount: toStoreNumber(transaction.amount),
    currency: transaction.currency,
    paymentMethod: transaction.paymentMethod,
    provider: transaction.provider,
    paymentStatus: transaction.paymentStatus,
    requestId: transaction.requestId,
    referenceId: transaction.referenceId,
    invoiceId: transaction.invoiceId,
    failedReason: transaction.failedReason,
    transactionDate: transaction.transactionDate,
  }
}

function createOrderNumber() {
  const now = new Date()
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("")
  return `ORD-${stamp}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
}

export function orderStatusFromPaymentStatus(status: "PAID" | "PENDING" | "FAILED" | "CANCELLED" | "EXPIRED") {
  if (status === "PAID") return "PROCESSING"
  if (status === "CANCELLED") return "CANCELLED"
  return "FAILED"
}

export async function initiateStoreWaafiPurchase(input: {
  buyer: StoreBuyer
  productId: string
  quantity: number
  phoneNumber: string
  provider: WaafiProvider
  currency?: string
}) {
  if (input.quantity < 1) throw new AppError(400, "Quantity must be at least 1")

  const [product, config] = await Promise.all([
    prisma.storeProduct.findFirst({ where: { id: input.productId, status: "PUBLISHED" } }),
    getWaafiConfig(),
  ])

  if (!product) throw new AppError(404, "Product not found")
  if (product.availableQuantity <= 0) throw new AppError(400, "Product is out of stock")
  if (input.quantity > product.availableQuantity) throw new AppError(400, "Requested quantity is more than available stock")

  const unitPrice = toStoreNumber(product.price)
  const totalAmount = Number((unitPrice * input.quantity).toFixed(2))
  if (totalAmount < 0.01) throw new AppError(400, "Amount must be at least 0.01")

  const requestId = buildWaafiRequestId()
  const referenceId = `STORE-${product.id}`
  const invoiceId = `STORE-INV-${requestId}`
  let phoneNumber = input.phoneNumber.replace(/\D/g, "")

  try {
    phoneNumber = normalizeSomaliaPhoneNumber(input.phoneNumber)
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Invalid Somalia mobile number"
    await prisma.storeTransaction.create({
      data: {
        buyerName: input.buyer.name,
        buyerType: input.buyer.type,
        phoneNumber,
        memberId: input.buyer.type === "MEMBER" ? input.buyer.id : null,
        trainerId: input.buyer.type === "TRAINER" ? input.buyer.id : null,
        productId: product.id,
        quantity: input.quantity,
        amount: totalAmount,
        currency: input.currency || "USD",
        paymentMethod: "WAAFI_PAY",
        provider: input.provider,
        paymentStatus: "FAILED",
        requestId,
        referenceId,
        invoiceId,
        failedReason: reason,
        rawResponse: { validationError: reason } as never,
      },
    })
    throw error
  }

  const transaction = await prisma.storeTransaction.create({
    data: {
      buyerName: input.buyer.name,
      buyerType: input.buyer.type,
      phoneNumber,
      memberId: input.buyer.type === "MEMBER" ? input.buyer.id : null,
      trainerId: input.buyer.type === "TRAINER" ? input.buyer.id : null,
      productId: product.id,
      quantity: input.quantity,
      amount: totalAmount,
      currency: input.currency || "USD",
      paymentMethod: "WAAFI_PAY",
      provider: input.provider,
      paymentStatus: "PENDING",
      requestId,
      referenceId,
      invoiceId,
    },
  })

  try {
    validateWaafiConfig(config)
  } catch (error) {
    const reason = error instanceof Error ? error.message : "WaafiPay is not configured"
    const failed = await prisma.storeTransaction.update({
      where: { id: transaction.id },
      data: {
        paymentStatus: "FAILED",
        failedReason: reason,
        rawResponse: { configurationError: reason } as never,
      },
    })
    await createActivityLog({
      type: "store",
      activity: "Store payment failed configuration",
      subject: product.name,
      subjectId: failed.id,
      userDisplay: input.buyer.name,
      metadata: { buyerType: input.buyer.type, reason },
    })
    throw error
  }

  const payload = buildWaafiPayload({
    merchantUid: config.waafiMerchantUid || "",
    apiUserId: config.waafiApiUserId || "",
    apiKey: config.waafiApiKey || "",
    phoneNumber,
    amount: totalAmount,
    currency: input.currency || "USD",
    referenceId,
    invoiceId,
    requestId,
    description: `Gym store purchase: ${product.name}`,
  })

  let waafiResponse: Awaited<ReturnType<typeof sendWaafiPaymentRequest>>
  try {
    waafiResponse = await sendWaafiPaymentRequest(payload, config.waafiApiBaseUrl || "")
  } catch (error) {
    const reason = error instanceof Error ? error.message : "WaafiPay request failed"
    await prisma.storeTransaction.update({
      where: { id: transaction.id },
      data: {
        paymentStatus: "FAILED",
        failedReason: reason,
        rawResponse: { requestError: reason } as never,
      },
    })
    throw new AppError(502, "WaafiPay request failed")
  }

  const paymentStatus = waafiResponse.ok && waafiResponse.waafiOk ? mapWaafiStatus(waafiResponse.body) : "FAILED"
  const responseMessage = getWaafiResponseMessage(waafiResponse.body)
  const responseId = getWaafiResponseId(waafiResponse.body)
  const waafiOrderId = getWaafiOrderId(waafiResponse.body)

  const updatedTransaction = await prisma.storeTransaction.update({
    where: { id: transaction.id },
    data: {
      transactionReference: responseId || requestId,
      paymentStatus,
      failedReason: paymentStatus === "FAILED" ? responseMessage || "WaafiPay request failed" : null,
      rawResponse: {
        httpStatus: waafiResponse.status,
        httpOk: waafiResponse.ok,
        waafiOk: waafiResponse.waafiOk,
        contentType: waafiResponse.contentType,
        responseId,
        orderId: waafiOrderId,
        responseMessage,
        body: waafiResponse.body,
        rawText: waafiResponse.rawText,
      } as never,
    },
  })

  if (paymentStatus !== "PAID") {
    await createActivityLog({
      type: "store",
      activity: "Store payment failed",
      subject: product.name,
      subjectId: updatedTransaction.id,
      userDisplay: input.buyer.name,
      metadata: { buyerType: input.buyer.type, status: paymentStatus, message: responseMessage },
    })
    return { transaction: updatedTransaction, order: null, product, paymentStatus }
  }

  const orderNumber = createOrderNumber()
  const paidAt = new Date()

  const { order, product: updatedProduct } = await prisma.$transaction(async (tx) => {
    const stockUpdate = await tx.storeProduct.updateMany({
      where: {
        id: product.id,
        availableQuantity: { gte: input.quantity },
      },
      data: {
        availableQuantity: { decrement: input.quantity },
      },
    })

    if (stockUpdate.count !== 1) {
      throw new AppError(409, "Product stock changed before order creation. Please contact support.")
    }

    const createdOrder = await tx.storeOrder.create({
      data: {
        orderNumber,
        buyerName: input.buyer.name,
        buyerType: input.buyer.type,
        buyerPhoneNumber: phoneNumber,
        memberId: input.buyer.type === "MEMBER" ? input.buyer.id : null,
        trainerId: input.buyer.type === "TRAINER" ? input.buyer.id : null,
        productId: product.id,
        quantity: input.quantity,
        unitPrice,
        totalAmount,
        currency: input.currency || "USD",
        paymentMethod: "WAAFI_PAY",
        onlineProvider: input.provider,
        evcTransactionReference: responseId || waafiOrderId || requestId,
        paymentStatus,
        orderStatus: orderStatusFromPaymentStatus(paymentStatus),
        requestId,
        referenceId,
        invoiceId,
        paidAt,
        orderDate: paidAt,
      },
      include: { product: true },
    })

    await tx.storeTransaction.update({
      where: { id: transaction.id },
      data: {
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
      },
    })

    const nextProduct = await tx.storeProduct.findUniqueOrThrow({ where: { id: product.id } })
    return { order: createdOrder, product: nextProduct }
  })

  await createActivityLog({
    type: "store",
    activity: "Created paid store order",
    subject: order.orderNumber,
    subjectId: order.id,
    userDisplay: input.buyer.name,
    metadata: {
      buyerType: input.buyer.type,
      productId: product.id,
      quantity: input.quantity,
      totalAmount,
      paymentStatus,
    },
  })

  return {
    transaction: await prisma.storeTransaction.findUnique({
      where: { id: transaction.id },
      include: { product: true, order: true },
    }),
    order,
    product: updatedProduct,
    paymentStatus,
  }
}

export function dateRangeFromFilter(filter?: string | null, customDate?: string | null) {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)

  if (filter === "yesterday") {
    start.setDate(start.getDate() - 1)
    end.setDate(end.getDate() - 1)
  } else if (filter === "week") {
    start.setDate(start.getDate() - 6)
  } else if (filter === "month") {
    start.setDate(1)
  } else if (filter === "year") {
    start.setMonth(0, 1)
  } else if (filter === "custom" && customDate) {
    const custom = new Date(customDate)
    if (!Number.isNaN(custom.getTime())) {
      start.setTime(custom.getTime())
      start.setHours(0, 0, 0, 0)
      end.setTime(custom.getTime())
      end.setHours(23, 59, 59, 999)
    }
  } else if (filter && filter !== "today") {
    return undefined
  }

  return { gte: start, lte: end }
}
