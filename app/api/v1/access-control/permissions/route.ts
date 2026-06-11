import { NextRequest } from "next/server"

import { createActivityLog, ensureAccessControlSeed } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"
import { paginationQuerySchema, permissionSchema } from "@/lib/validations/access-control"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    await requirePermission("permissions.view")
    await ensureAccessControlSeed()

    const { searchParams } = new URL(request.url)
    const { page, limit, search } = paginationQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search") ?? undefined,
    })

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { guardName: { contains: search, mode: "insensitive" as const } },
            { groupKey: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}

    const [permissions, total] = await Promise.all([
      prisma.accessPermission.findMany({
        where,
        orderBy: [{ groupKey: "asc" }, { name: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.accessPermission.count({ where }),
    ])

    return {
      permissions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    }
  }, { path: "/api/v1/access-control/permissions", method: "GET" })
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requirePermission("permissions.create")
    await ensureAccessControlSeed()
    const payload = permissionSchema.parse(await request.json())

    const permission = await prisma.accessPermission.create({
      data: payload,
    })

    await createActivityLog({
      type: "permissions",
      activity: "Created permission",
      subject: permission.name,
      subjectId: permission.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
    })

    return {
      permission,
      message: "Permission created successfully",
    }
  }, { path: "/api/v1/access-control/permissions", method: "POST" })
}
