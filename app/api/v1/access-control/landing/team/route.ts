import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"
import { landingTeamMemberSchema } from "@/lib/validations/landing"

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requirePermission("landing.update")
    const payload = landingTeamMemberSchema.parse(await request.json())
    const latest = await prisma.landingTeamMember.aggregate({ _max: { position: true } })
    const teamMember = await prisma.landingTeamMember.create({ data: { ...payload, position: (latest._max.position ?? -1) + 1 } })
    await createActivityLog({ type: "landing", activity: "Added a team member", subject: teamMember.name, subjectId: teamMember.id, userId: session.user.id, userDisplay: session.user.name || session.user.email || "System Admin" })
    return { teamMember, message: "Team member added" }
  }, { path: "/api/v1/access-control/landing/team", method: "POST" })
}
