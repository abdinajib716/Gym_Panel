import { NextRequest } from "next/server"

import { ensureAccessControlSeed } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"
import { activityLogQuerySchema } from "@/lib/validations/access-control"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    await requirePermission("activity-logs.view")
    await ensureAccessControlSeed()

    const { searchParams } = new URL(request.url)
    const { page, limit, search, type, sort } = activityLogQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
    })

    const where = {
      ...(type ? { type } : {}),
      ...(search
        ? {
            OR: [
              { activity: { contains: search, mode: "insensitive" as const } },
              { subject: { contains: search, mode: "insensitive" as const } },
              { userDisplay: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    }

    const orderBy = { createdAt: sort === "date-asc" ? "asc" : "desc" } as const

    const [logs, total] = await Promise.all([
      prisma.accessActivityLog.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.accessActivityLog.count({ where }),
    ])

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    }
  }, { path: "/api/v1/access-control/activity-logs", method: "GET" })
}
