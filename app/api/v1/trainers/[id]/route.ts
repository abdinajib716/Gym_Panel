import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { emptyToNull } from "@/lib/gym-api"
import { prisma } from "@/lib/prisma"
import { trainerUpdateSchema } from "@/lib/validations/gym"
import { safeMobileAccount } from "@/lib/mobile-credentials"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    await requirePermission("trainers.view")
    const { id } = await params

    const trainer = await prisma.trainer.findUnique({
      where: { id },
      include: {
        members: {
          orderBy: { fullName: "asc" },
          include: {
            subscriptions: { orderBy: { createdAt: "desc" }, take: 1, include: { plan: true } },
            attendance: { orderBy: { checkInDate: "desc" }, take: 30 },
            workouts: { orderBy: { createdAt: "desc" }, take: 1 },
            trainerSchedules: { where: { date: { gte: new Date() } }, orderBy: { date: "asc" }, take: 1 },
          },
        },
        groups: { include: { _count: { select: { members: true } } }, orderBy: { name: "asc" } },
        workouts: { include: { member: true, group: true }, orderBy: { createdAt: "desc" } },
        schedules: { include: { member: true, group: true, workout: true }, orderBy: { date: "desc" } },
        mobileAccount: true,
      },
    })

    if (!trainer) {
      throw new AppError(404, "Trainer not found")
    }

    return {
      trainer: {
        ...trainer,
        mobileAccount: trainer.mobileAccount ? safeMobileAccount(trainer.mobileAccount) : null,
      },
    }
  }, { path: "/api/v1/trainers/[id]", method: "GET" })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await requirePermission("trainers.update")
    const { id } = await params
    const payload = trainerUpdateSchema.parse(await request.json())

    const existingTrainer = await prisma.trainer.findUnique({ where: { id } })
    if (!existingTrainer) {
      throw new AppError(404, "Trainer not found")
    }

    const trainer = await prisma.trainer.update({
      where: { id },
      data: {
        ...(payload.fullName !== undefined ? { fullName: payload.fullName } : {}),
        ...(payload.phoneNumber !== undefined ? { phoneNumber: payload.phoneNumber } : {}),
        ...(payload.email !== undefined ? { email: emptyToNull(payload.email) } : {}),
        ...(payload.gender !== undefined ? { gender: payload.gender } : {}),
        ...(payload.specialty !== undefined ? { specialty: payload.specialty } : {}),
        ...(payload.availability !== undefined ? { availability: emptyToNull(payload.availability) } : {}),
        ...(payload.profileImage !== undefined ? { profileImage: emptyToNull(payload.profileImage) } : {}),
        ...(payload.status !== undefined ? { status: payload.status } : {}),
      },
    })

    if (existingTrainer && (payload.status !== undefined || payload.email !== undefined || payload.phoneNumber !== undefined)) {
      await prisma.mobileAccount.updateMany({
        where: { trainerId: id },
        data: {
          ...(payload.status !== undefined ? { accountStatus: payload.status === "ACTIVE" ? "ACTIVE" : "INACTIVE" } : {}),
          ...(payload.email !== undefined ? { loginEmail: emptyToNull(payload.email) } : {}),
          ...(payload.phoneNumber !== undefined ? { loginPhone: payload.phoneNumber } : {}),
        },
      })
    }

    await createActivityLog({
      type: "trainers",
      activity: "Updated trainer",
      subject: trainer.fullName,
      subjectId: trainer.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
    })

    return { trainer, message: "Trainer updated successfully" }
  }, { path: "/api/v1/trainers/[id]", method: "PUT" })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await requirePermission("trainers.delete")
    const { id } = await params

    const existingTrainer = await prisma.trainer.findUnique({ where: { id } })
    if (!existingTrainer) {
      throw new AppError(404, "Trainer not found")
    }

    await prisma.trainer.delete({ where: { id } })

    await createActivityLog({
      type: "trainers",
      activity: "Deleted trainer",
      subject: existingTrainer.fullName,
      subjectId: existingTrainer.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
    })

    return { success: true, message: "Trainer deleted successfully" }
  }, { path: "/api/v1/trainers/[id]", method: "DELETE" })
}
