import bcrypt from "bcryptjs"
import { NextRequest } from "next/server"

import { createActivityLog, ensureAccessControlSeed } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"
import { createUserSchema, paginationQuerySchema } from "@/lib/validations/access-control"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    await requirePermission("users.view")
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
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { username: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}

    const [users, total, roles] = await Promise.all([
      prisma.accessUser.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      }),
      prisma.accessUser.count({ where }),
      prisma.accessRole.findMany({
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
        orderBy: { name: "asc" },
      }),
    ])

    return {
      users: users.map((user) => ({
        ...user,
        roles: user.roles.map((entry) => entry.role),
      })),
      roles: roles.map((role) => ({
        ...role,
        permissions: role.permissions.map((entry) => entry.permission),
      })),
      pagination: {
        total,
        page,
        limit,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    }
  }, { path: "/api/v1/access-control/users", method: "GET" })
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requirePermission("users.create")
    await ensureAccessControlSeed()

    const payload = createUserSchema.parse(await request.json())
    const passwordHash = payload.password ? await bcrypt.hash(payload.password, 10) : null

    const user = await prisma.accessUser.create({
      data: {
        avatarUrl: payload.avatarUrl || null,
        firstName: payload.firstName,
        lastName: payload.lastName,
        username: payload.username,
        email: payload.email,
        passwordHash,
        displayName: payload.displayName || `${payload.firstName} ${payload.lastName}`.trim(),
        roles: {
          create: payload.roleIds.map((roleId: string) => ({
            roleId,
          })),
        },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    await createActivityLog({
      type: "users",
      activity: "Created user",
      subject: `${user.firstName} ${user.lastName}`,
      subjectId: user.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
    })

    return {
      user: {
        ...user,
        roles: user.roles.map((entry) => entry.role),
      },
      message: "User created successfully",
    }
  }, { path: "/api/v1/access-control/users", method: "POST" })
}
