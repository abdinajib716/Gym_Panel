import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"
import { landingTeamMemberSchema } from "@/lib/validations/landing"

type Context = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Context) {
  return withErrorHandling(async () => {
    const session = await requirePermission("landing.update")
    const payload = landingTeamMemberSchema.parse(await request.json())
    const { id } = await params
    const teamMember = await prisma.landingTeamMember.update({ where: { id }, data: payload })
    await createActivityLog({ type: "landing", activity: "Updated a team member", subject: teamMember.name, subjectId: id, userId: session.user.id, userDisplay: session.user.name || session.user.email || "System Admin" })
    return { teamMember, message: "Team member updated" }
  }, { path: "/api/v1/access-control/landing/team/[id]", method: "PUT" })
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  return withErrorHandling(async () => {
    const session = await requirePermission("landing.update")
    const { id } = await params
    const teamMember = await prisma.landingTeamMember.delete({ where: { id } })
    await createActivityLog({ type: "landing", activity: "Removed a team member", subject: teamMember.name, subjectId: id, userId: session.user.id, userDisplay: session.user.name || session.user.email || "System Admin" })
    return { message: "Team member removed" }
  }, { path: "/api/v1/access-control/landing/team/[id]", method: "DELETE" })
}
