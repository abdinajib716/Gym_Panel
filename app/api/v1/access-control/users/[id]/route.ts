import bcrypt from "bcryptjs"
import { NextRequest } from "next/server"

import { createActivityLog, ensureAccessControlSeed } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"
import { updateUserSchema } from "@/lib/validations/access-control"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    await requirePermission("users.view")
    await ensureAccessControlSeed()

    const { id } = await params
    const user = await prisma.accessUser.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    if (!user) {
      throw new AppError(404, "User not found")
    }

    return {
      user: {
        ...user,
        roles: user.roles.map((entry) => entry.role),
      },
    }
  }, { path: "/api/v1/access-control/users/[id]", method: "GET" })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await requirePermission("users.update")
    await ensureAccessControlSeed()

    const { id } = await params
    const payload = updateUserSchema.parse(await request.json())

    const existingUser = await prisma.accessUser.findUnique({ where: { id } })
    if (!existingUser) {
      throw new AppError(404, "User not found")
    }

    const passwordHash = payload.password ? await bcrypt.hash(payload.password, 10) : undefined

    await prisma.accessUser.update({
      where: { id },
      data: {
        avatarUrl: payload.avatarUrl ?? existingUser.avatarUrl,
        firstName: payload.firstName ?? existingUser.firstName,
        lastName: payload.lastName ?? existingUser.lastName,
        username: payload.username ?? existingUser.username,
        email: payload.email ?? existingUser.email,
        displayName: payload.displayName ?? existingUser.displayName,
        ...(passwordHash ? { passwordHash } : {}),
      },
    })

    if (payload.roleIds) {
      await prisma.accessUserRole.deleteMany({ where: { userId: id } })
      if (payload.roleIds.length > 0) {
        await prisma.accessUserRole.createMany({
          data: payload.roleIds.map((roleId: string) => ({ userId: id, roleId })),
        })
      }
    }

    const user = await prisma.accessUser.findUniqueOrThrow({
      where: { id },
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
      activity: "Updated user",
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
      message: "User updated successfully",
    }
  }, { path: "/api/v1/access-control/users/[id]", method: "PUT" })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await requirePermission("users.delete")
    await ensureAccessControlSeed()

    const { id } = await params
    const existingUser = await prisma.accessUser.findUnique({ where: { id } })
    if (!existingUser) {
      throw new AppError(404, "User not found")
    }

    await prisma.accessUser.delete({ where: { id } })

    await createActivityLog({
      type: "users",
      activity: "Deleted user",
      subject: `${existingUser.firstName} ${existingUser.lastName}`,
      subjectId: existingUser.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
    })

    return { success: true, message: "User deleted successfully" }
  }, { path: "/api/v1/access-control/users/[id]", method: "DELETE" })
}
