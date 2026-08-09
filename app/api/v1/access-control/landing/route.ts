import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import { getLandingContent } from "@/lib/landing"
import { prisma } from "@/lib/prisma"
import { landingPageUpdateSchema } from "@/lib/validations/landing"

export async function GET() {
  return withErrorHandling(async () => {
    await requirePermission("landing.view")
    const landing = await getLandingContent({ includeDrafts: true })
    const messages = await prisma.landingContactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 50 })
    return { landing, messages }
  }, { path: "/api/v1/access-control/landing", method: "GET" })
}

export async function PUT(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requirePermission("landing.update")
    const payload = landingPageUpdateSchema.parse(await request.json())
    const { page } = await getLandingContent({ includeDrafts: true })
    const landingPage = await prisma.landingPage.update({ where: { id: page.id }, data: payload })

    await createActivityLog({
      type: "landing",
      activity: "Updated public website content",
      subject: "Landing page",
      subjectId: landingPage.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
      metadata: payload,
    })

    return { landingPage, message: "Landing page saved" }
  }, { path: "/api/v1/access-control/landing", method: "PUT" })
}
