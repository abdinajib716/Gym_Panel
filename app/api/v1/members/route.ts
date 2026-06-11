import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { emptyToNull, optionalDate, paginationMeta } from "@/lib/gym-api"
import { withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"
import { gymPaginationQuerySchema, memberCreateSchema } from "@/lib/validations/gym"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    await requirePermission("members.view")

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
              { fullName: { contains: search, mode: "insensitive" as const } },
              { phoneNumber: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
        }
      : {}),
    } as never

    const [members, total, trainers, plans] = await Promise.all([
      prisma.member.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          trainer: true,
          subscriptions: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { plan: true },
          },
        },
      }),
      prisma.member.count({ where }),
      prisma.trainer.findMany({ orderBy: { fullName: "asc" } }),
      prisma.membershipPlan.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    ])

    return {
      members,
      trainers,
      plans,
      pagination: paginationMeta(total, page, limit),
    }
  }, { path: "/api/v1/members", method: "GET" })
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requirePermission("members.create")
    const payload = memberCreateSchema.parse(await request.json())

    const member = await prisma.$transaction(async (tx) => {
      const selectedPlan = payload.initialPlanId
        ? await tx.membershipPlan.findUnique({ where: { id: payload.initialPlanId } })
        : null
      const paid = payload.paymentStatus === "PAID"

      const createdMember = await tx.member.create({
        data: {
          fullName: payload.fullName,
          phoneNumber: payload.phoneNumber,
          email: emptyToNull(payload.email),
          gender: payload.gender,
          address: emptyToNull(payload.address),
          dateOfBirth: optionalDate(payload.dateOfBirth),
          emergencyContact: emptyToNull(payload.emergencyContact),
          profileImage: emptyToNull(payload.profileImage),
          status: selectedPlan && paid ? "ACTIVE" : payload.status,
          trainerId: emptyToNull(payload.trainerId),
        },
      })

      if (selectedPlan) {
        const startDate = payload.subscriptionStartDate ? new Date(payload.subscriptionStartDate) : new Date()
        const expiryDate = new Date(startDate)
        expiryDate.setDate(expiryDate.getDate() + selectedPlan.durationDays)

        const subscription = await tx.subscription.create({
          data: {
            memberId: createdMember.id,
            planId: selectedPlan.id,
            startDate,
            expiryDate,
            status: paid ? "ACTIVE" : "PENDING",
            paymentStatus: payload.paymentStatus,
          },
        })

        await tx.payment.create({
          data: {
            memberId: createdMember.id,
            subscriptionId: subscription.id,
            planId: selectedPlan.id,
            amount: payload.paymentAmount === "" || payload.paymentAmount === undefined ? Number(selectedPlan.price) : Number(payload.paymentAmount),
            method: payload.paymentMethod,
            status: payload.paymentStatus,
            paymentDate: payload.paymentDate ? new Date(payload.paymentDate) : new Date(),
            reference: emptyToNull(payload.paymentReference),
            notes: emptyToNull(payload.paymentNotes),
          },
        })
      }

      return createdMember
    })

    await createActivityLog({
      type: "members",
      activity: payload.initialPlanId ? "Created member with subscription and payment" : "Created member",
      subject: member.fullName,
      subjectId: member.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
      metadata: payload.initialPlanId
        ? {
            planId: payload.initialPlanId,
            paymentStatus: payload.paymentStatus,
            paymentMethod: payload.paymentMethod,
          }
        : undefined,
    })

    return { member, message: payload.initialPlanId ? "Member, subscription, and payment created successfully" : "Member created successfully" }
  }, { path: "/api/v1/members", method: "POST" })
}
