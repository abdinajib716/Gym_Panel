import { prisma } from "@/lib/prisma"

export function emptyToNull(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function optionalDate(value: string | null | undefined) {
  return value ? new Date(value) : null
}

export function requiredDate(value: string) {
  return new Date(value)
}

export function paginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(total / limit)),
  }
}

export function dateRangeFilter(dateFrom?: string, dateTo?: string) {
  if (!dateFrom && !dateTo) return {}

  return {
    gte: dateFrom ? new Date(dateFrom) : undefined,
    lte: dateTo ? new Date(dateTo) : undefined,
  }
}

export async function syncSubscriptionAfterPayment(input: {
  subscriptionId?: string | null
  memberId: string
  status: "PAID" | "PENDING" | "FAILED" | "CANCELLED" | "EXPIRED"
}) {
  if (!input.subscriptionId) return

  if (input.status === "PAID") {
    await prisma.subscription.update({
      where: { id: input.subscriptionId },
      data: {
        status: "ACTIVE",
        paymentStatus: "PAID",
      },
    })

    await prisma.member.update({
      where: { id: input.memberId },
      data: { status: "ACTIVE" },
    })
    return
  }

  await prisma.subscription.update({
    where: { id: input.subscriptionId },
    data: {
      paymentStatus: input.status,
      status: input.status === "PENDING" ? "PENDING" : "SUSPENDED",
    },
  })
}

export function normalizeSubscriptionStatus(input: {
  status?: "ACTIVE" | "EXPIRED" | "PENDING" | "SUSPENDED"
  paymentStatus?: "PAID" | "PENDING" | "FAILED" | "CANCELLED" | "EXPIRED"
}) {
  if (input.status === "ACTIVE" && input.paymentStatus !== "PAID") {
    return "PENDING"
  }

  return input.status ?? "PENDING"
}

export function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}
