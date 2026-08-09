import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { emptyToNull } from "@/lib/gym-api"
import { prisma } from "@/lib/prisma"
import { membershipPlanUpdateSchema } from "@/lib/validations/gym"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    await requirePermission("plans.view")
    const { id } = await params

    const plan = await prisma.membershipPlan.findUnique({
      where: { id },
      include: { subscriptions: { include: { member: true }, orderBy: { createdAt: "desc" } } },
    })

    if (!plan) {
      throw new AppError(404, "Membership plan not found")
    }

    return { plan }
  }, { path: "/api/v1/membership-plans/[id]", method: "GET" })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await requirePermission("plans.update")
    const { id } = await params
    const payload = membershipPlanUpdateSchema.parse(await request.json())

    const existingPlan = await prisma.membershipPlan.findUnique({ where: { id } })
    if (!existingPlan) {
      throw new AppError(404, "Membership plan not found")
    }

    const plan = await prisma.membershipPlan.update({
      where: { id },
      data: {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.type !== undefined ? { type: payload.type } : {}),
        ...(payload.durationDays !== undefined ? { durationDays: payload.durationDays } : {}),
        ...(payload.price !== undefined ? { price: payload.price } : {}),
        ...(payload.description !== undefined ? { description: emptyToNull(payload.description) } : {}),
        ...(payload.status !== undefined ? { status: payload.status } : {}),
      },
    })

    await createActivityLog({
      type: "plans",
      activity: payload.status && payload.status !== existingPlan.status ? `${payload.status === "ACTIVE" ? "Activated" : "Deactivated"} membership plan` : "Updated membership plan",
      subject: plan.name,
      subjectId: plan.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
    })

    return { plan, message: "Membership plan updated successfully" }
  }, { path: "/api/v1/membership-plans/[id]", method: "PUT" })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await requirePermission("plans.delete")
    const { id } = await params

    const existingPlan = await prisma.membershipPlan.findUnique({ where: { id } })
    if (!existingPlan) {
      throw new AppError(404, "Membership plan not found")
    }

    await prisma.membershipPlan.delete({ where: { id } })

    await createActivityLog({
      type: "plans",
      activity: "Deleted membership plan",
      subject: existingPlan.name,
      subjectId: existingPlan.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
    })

    return { success: true, message: "Membership plan deleted successfully" }
  }, { path: "/api/v1/membership-plans/[id]", method: "DELETE" })
}
