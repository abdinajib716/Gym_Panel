import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { emptyToNull, optionalDate } from "@/lib/gym-api"
import { prisma } from "@/lib/prisma"
import { memberUpdateSchema } from "@/lib/validations/gym"
import { safeMobileAccount } from "@/lib/mobile-credentials"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    await requirePermission("members.view")
    const { id } = await params

    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        trainer: true,
        subscriptions: { include: { plan: true, payments: true }, orderBy: { createdAt: "desc" } },
        payments: { include: { plan: true, subscription: true }, orderBy: { paymentDate: "desc" } },
        attendance: { orderBy: { checkInDate: "desc" } },
        notifications: { orderBy: { createdAt: "desc" } },
        mobileAccount: true,
      },
    })

    if (!member) {
      throw new AppError(404, "Member not found")
    }

    return {
      member: {
        ...member,
        mobileAccount: member.mobileAccount ? safeMobileAccount(member.mobileAccount) : null,
      },
    }
  }, { path: "/api/v1/members/[id]", method: "GET" })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await requirePermission("members.update")
    const { id } = await params
    const payload = memberUpdateSchema.parse(await request.json())

    const existingMember = await prisma.member.findUnique({ where: { id } })
    if (!existingMember) {
      throw new AppError(404, "Member not found")
    }

    const member = await prisma.member.update({
      where: { id },
      data: {
        ...(payload.fullName !== undefined ? { fullName: payload.fullName } : {}),
        ...(payload.phoneNumber !== undefined ? { phoneNumber: payload.phoneNumber } : {}),
        ...(payload.email !== undefined ? { email: emptyToNull(payload.email) } : {}),
        ...(payload.gender !== undefined ? { gender: payload.gender } : {}),
        ...(payload.address !== undefined ? { address: emptyToNull(payload.address) } : {}),
        ...(payload.dateOfBirth !== undefined ? { dateOfBirth: optionalDate(payload.dateOfBirth) } : {}),
        ...(payload.emergencyContact !== undefined ? { emergencyContact: emptyToNull(payload.emergencyContact) } : {}),
        ...(payload.profileImage !== undefined ? { profileImage: emptyToNull(payload.profileImage) } : {}),
        ...(payload.status !== undefined ? { status: payload.status } : {}),
        ...(payload.trainerId !== undefined ? { trainerId: emptyToNull(payload.trainerId) } : {}),
      },
    })

    await createActivityLog({
      type: "members",
      activity: payload.status === "SUSPENDED" ? "Suspended member" : "Updated member",
      subject: member.fullName,
      subjectId: member.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
    })

    return { member, message: "Member updated successfully" }
  }, { path: "/api/v1/members/[id]", method: "PUT" })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await requirePermission("members.delete")
    const { id } = await params

    const existingMember = await prisma.member.findUnique({ where: { id } })
    if (!existingMember) {
      throw new AppError(404, "Member not found")
    }

    await prisma.member.delete({ where: { id } })

    await createActivityLog({
      type: "members",
      activity: "Deleted member",
      subject: existingMember.fullName,
      subjectId: existingMember.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
    })

    return { success: true, message: "Member deleted successfully" }
  }, { path: "/api/v1/members/[id]", method: "DELETE" })
}
