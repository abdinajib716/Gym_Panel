import { NextRequest } from "next/server"

import { createActivityLog, ensureAccessControlSeed } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"
import { paginationQuerySchema, roleSchema } from "@/lib/validations/access-control"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    await requirePermission("roles.view")
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
          ],
        }
      : {}

    const [roles, total, permissions] = await Promise.all([
      prisma.accessRole.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      }),
      prisma.accessRole.count({ where }),
      prisma.accessPermission.findMany({
        orderBy: [{ groupKey: "asc" }, { name: "asc" }],
      }),
    ])

    return {
      roles: roles.map((role) => ({
        ...role,
        permissions: role.permissions.map((entry) => entry.permission),
      })),
      permissions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    }
  }, { path: "/api/v1/access-control/roles", method: "GET" })
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requirePermission("roles.create")
    await ensureAccessControlSeed()
    const payload = roleSchema.parse(await request.json())

    const role = await prisma.accessRole.create({
      data: {
        name: payload.name,
        guardName: payload.guardName,
        permissions: {
          create: payload.permissionIds.map((permissionId: string) => ({
            permissionId,
          })),
        },
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    })

    await createActivityLog({
      type: "roles",
      activity: "Created role",
      subject: role.name,
      subjectId: role.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
    })

    return {
      role: {
        ...role,
        permissions: role.permissions.map((entry) => entry.permission),
      },
      message: "Role created successfully",
    }
  }, { path: "/api/v1/access-control/roles", method: "POST" })
}
