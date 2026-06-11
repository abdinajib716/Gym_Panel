import { NextRequest } from "next/server"

import { createActivityLog, ensureAccessControlSeed } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"
import { roleSchema } from "@/lib/validations/access-control"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    await requirePermission("roles.view")
    await ensureAccessControlSeed()

    const { id } = await params
    const role = await prisma.accessRole.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    })

    if (!role) {
      throw new AppError(404, "Role not found")
    }

    return {
      role: {
        ...role,
        permissions: role.permissions.map((entry) => entry.permission),
      },
    }
  }, { path: "/api/v1/access-control/roles/[id]", method: "GET" })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await requirePermission("roles.update")
    await ensureAccessControlSeed()
    const { id } = await params
    const payload = roleSchema.parse(await request.json())

    const existingRole = await prisma.accessRole.findUnique({ where: { id } })
    if (!existingRole) {
      throw new AppError(404, "Role not found")
    }

    await prisma.accessRole.update({
      where: { id },
      data: {
        name: payload.name,
        guardName: payload.guardName,
      },
    })

    await prisma.accessRolePermission.deleteMany({
      where: { roleId: id },
    })

    if (payload.permissionIds.length > 0) {
      await prisma.accessRolePermission.createMany({
        data: payload.permissionIds.map((permissionId: string) => ({
          roleId: id,
          permissionId,
        })),
      })
    }

    const role = await prisma.accessRole.findUniqueOrThrow({
      where: { id },
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
      activity: "Updated role",
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
      message: "Role updated successfully",
    }
  }, { path: "/api/v1/access-control/roles/[id]", method: "PUT" })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await requirePermission("roles.delete")
    await ensureAccessControlSeed()
    const { id } = await params

    const existingRole = await prisma.accessRole.findUnique({ where: { id } })
    if (!existingRole) {
      throw new AppError(404, "Role not found")
    }

    await prisma.accessRole.delete({ where: { id } })

    await createActivityLog({
      type: "roles",
      activity: "Deleted role",
      subject: existingRole.name,
      subjectId: existingRole.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
    })

    return { success: true, message: "Role deleted successfully" }
  }, { path: "/api/v1/access-control/roles/[id]", method: "DELETE" })
}
