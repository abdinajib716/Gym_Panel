import { NextRequest } from "next/server"
import { requirePermission } from "@/lib/auth"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    await requirePermission("trainers.update")
    const { id } = await params
    const { memberId } = await request.json() as { memberId?: string }
    if (!memberId) throw new AppError(400, "Member is required")
    await prisma.trainer.findUniqueOrThrow({ where: { id } })
    const member = await prisma.member.update({ where: { id: memberId }, data: { trainerId: id } })
    return { member, message: "Member assigned to trainer successfully" }
  }, { path: "/api/v1/trainers/[id]/members", method: "POST" })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    await requirePermission("trainers.update")
    const { id } = await params
    const { memberId } = await request.json() as { memberId?: string }
    const member = await prisma.member.findFirst({ where: { id: memberId, trainerId: id } })
    if (!member) throw new AppError(404, "Assigned member not found")
    await prisma.member.update({ where: { id: member.id }, data: { trainerId: null } })
    return { success: true, message: "Member removed from trainer" }
  }, { path: "/api/v1/trainers/[id]/members", method: "DELETE" })
}
