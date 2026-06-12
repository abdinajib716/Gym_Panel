import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import { emptyToNull, paginationMeta } from "@/lib/gym-api"
import { prisma } from "@/lib/prisma"
import { gymPaginationQuerySchema, trainerSchema } from "@/lib/validations/gym"
import { createTrainerMobileAccount, credentialMessage } from "@/lib/mobile-credentials"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    await requirePermission("trainers.view")

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
              { specialty: { contains: search, mode: "insensitive" as const } },
            ],
        }
      : {}),
    } as never

    const [trainers, total] = await Promise.all([
      prisma.trainer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { members: true } } },
      }),
      prisma.trainer.count({ where }),
    ])

    return { trainers, pagination: paginationMeta(total, page, limit) }
  }, { path: "/api/v1/trainers", method: "GET" })
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requirePermission("trainers.create")
    const payload = trainerSchema.parse(await request.json())

    const trainer = await prisma.trainer.create({
      data: {
        fullName: payload.fullName,
        phoneNumber: payload.phoneNumber,
        email: emptyToNull(payload.email),
        gender: payload.gender,
        specialty: payload.specialty,
        availability: emptyToNull(payload.availability),
        status: payload.status,
      },
    })

    await createActivityLog({
      type: "trainers",
      activity: "Created trainer",
      subject: trainer.fullName,
      subjectId: trainer.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
    })

    const credentials = await createTrainerMobileAccount({
      trainerId: trainer.id,
      actor: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    })

    return {
      trainer,
      emailStatus: credentials.emailStatus,
      message: credentialMessage("Trainer", credentials.emailStatus),
    }
  }, { path: "/api/v1/trainers", method: "POST" })
}
