import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"

const bulkDeleteConfig = {
  members: { permission: "members.delete", label: "Members" },
  trainers: { permission: "trainers.delete", label: "Trainers" },
  "membership-plans": { permission: "plans.delete", label: "Membership Plans" },
  subscriptions: { permission: "subscriptions.delete", label: "Subscriptions" },
  payments: { permission: "payments.delete", label: "Payments" },
  attendance: { permission: "attendance.delete", label: "Attendance" },
  notifications: { permission: "notifications.delete", label: "Notifications" },
  "store-products": { permission: "store_products.delete", label: "Store Products" },
} as const

type BulkDeleteResource = keyof typeof bulkDeleteConfig

function isBulkDeleteResource(value: string): value is BulkDeleteResource {
  return value in bulkDeleteConfig
}

async function deleteResource(resource: BulkDeleteResource, ids: string[]) {
  switch (resource) {
    case "members":
      return prisma.member.deleteMany({ where: { id: { in: ids } } })
    case "trainers":
      return prisma.trainer.deleteMany({ where: { id: { in: ids } } })
    case "membership-plans":
      return prisma.membershipPlan.deleteMany({ where: { id: { in: ids } } })
    case "subscriptions":
      return prisma.subscription.deleteMany({ where: { id: { in: ids } } })
    case "payments":
      return prisma.payment.deleteMany({ where: { id: { in: ids } } })
    case "attendance":
      return prisma.attendance.deleteMany({ where: { id: { in: ids } } })
    case "notifications":
      return prisma.notification.deleteMany({ where: { id: { in: ids } } })
    case "store-products":
      return prisma.storeProduct.deleteMany({ where: { id: { in: ids }, orders: { none: {} }, transactions: { none: {} } } })
  }
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const payload = (await request.json().catch(() => ({}))) as {
      resource?: string
      ids?: unknown
    }

    const resource = payload.resource || ""
    if (!isBulkDeleteResource(resource)) {
      throw new AppError(400, "Bulk delete resource is invalid")
    }

    const ids = Array.isArray(payload.ids)
      ? Array.from(new Set(payload.ids.filter((id): id is string => typeof id === "string" && id.trim().length > 0)))
      : []

    if (ids.length === 0) {
      throw new AppError(400, "Select at least one record to delete")
    }

    const config = bulkDeleteConfig[resource]
    const session = await requirePermission(config.permission)
    const result = await deleteResource(resource, ids)

    await createActivityLog({
      type: resource,
      activity: `Bulk deleted ${config.label.toLowerCase()}`,
      subject: `${result.count} ${config.label}`,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
      metadata: { ids, count: result.count },
    })

    return {
      success: true,
      deletedCount: result.count,
      message: `${result.count} ${result.count === 1 ? "record" : "records"} deleted successfully`,
    }
  }, { path: "/api/v1/bulk-delete", method: "POST" })
}
