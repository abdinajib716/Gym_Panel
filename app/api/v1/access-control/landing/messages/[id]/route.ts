import { NextRequest } from "next/server"

import { requirePermission } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"
import { landingMessageStatusSchema } from "@/lib/validations/landing"

type Context = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Context) {
  return withErrorHandling(async () => {
    await requirePermission("landing.update")
    const payload = landingMessageStatusSchema.parse(await request.json())
    const { id } = await params
    const contactMessage = await prisma.landingContactMessage.update({ where: { id }, data: payload })
    return { contactMessage, message: "Message status updated" }
  }, { path: "/api/v1/access-control/landing/messages/[id]", method: "PUT" })
}
