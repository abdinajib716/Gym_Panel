import { NextRequest } from "next/server"

import { createActivityLog, ensureAccessControlSeed } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"
import { permissionSchema } from "@/lib/validations/access-control"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    await requirePermission("permissions.view")
    await ensureAccessControlSeed()
    const { id } = await params

    const permission = await prisma.accessPermission.findUnique({ where: { id } })
    if (!permission) {
      throw new AppError(404, "Permission not found")
    }

    return { permission }
  }, { path: "/api/v1/access-control/permissions/[id]", method: "GET" })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await requirePermission("permissions.update")
    await ensureAccessControlSeed()
    const { id } = await params
    const payload = permissionSchema.parse(await request.json())

    const existingPermission = await prisma.accessPermission.findUnique({ where: { id } })
    if (!existingPermission) {
      throw new AppError(404, "Permission not found")
    }

    const permission = await prisma.accessPermission.update({
      where: { id },
      data: payload,
    })

    await createActivityLog({
      type: "permissions",
      activity: "Updated permission",
      subject: permission.name,
      subjectId: permission.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
    })

    return {
      permission,
      message: "Permission updated successfully",
    }
  }, { path: "/api/v1/access-control/permissions/[id]", method: "PUT" })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await requirePermission("permissions.delete")
    await ensureAccessControlSeed()
    const { id } = await params

    const existingPermission = await prisma.accessPermission.findUnique({ where: { id } })
    if (!existingPermission) {
      throw new AppError(404, "Permission not found")
    }

    await prisma.accessPermission.delete({ where: { id } })

    await createActivityLog({
      type: "permissions",
      activity: "Deleted permission",
      subject: existingPermission.name,
      subjectId: existingPermission.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
    })

    return { success: true, message: "Permission deleted successfully" }
  }, { path: "/api/v1/access-control/permissions/[id]", method: "DELETE" })
}
