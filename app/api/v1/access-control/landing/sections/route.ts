import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import { getLandingContent } from "@/lib/landing"
import { prisma } from "@/lib/prisma"
import { landingSectionsSchema } from "@/lib/validations/landing"

export async function PUT(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requirePermission("landing.update")
    const payload = landingSectionsSchema.parse(await request.json())
    const { page } = await getLandingContent({ includeDrafts: true })
    const validIds = new Set((await prisma.landingSection.findMany({ where: { pageId: page.id }, select: { id: true } })).map((section) => section.id))

    if (payload.sections.some((section) => !validIds.has(section.id))) {
      throw new Error("One or more landing sections are invalid")
    }

    await prisma.$transaction([
      ...payload.sections.map((section, index) => prisma.landingSection.update({
        where: { id: section.id },
        data: { position: -index - 1 },
      })),
      ...payload.sections.map((section) => prisma.landingSection.update({
        where: { id: section.id },
        data: { position: section.position, published: section.published },
      })),
    ])

    await createActivityLog({
      type: "landing",
      activity: "Reordered public website sections",
      subject: "Landing page sections",
      subjectId: page.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
    })

    return { message: "Section order saved" }
  }, { path: "/api/v1/access-control/landing/sections", method: "PUT" })
}
