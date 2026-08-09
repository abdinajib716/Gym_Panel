import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"
import { landingTestimonialSchema } from "@/lib/validations/landing"

type Context = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Context) {
  return withErrorHandling(async () => {
    const session = await requirePermission("landing.update")
    const payload = landingTestimonialSchema.parse(await request.json())
    const { id } = await params
    const testimonial = await prisma.landingTestimonial.update({ where: { id }, data: payload })
    await createActivityLog({ type: "landing", activity: "Updated a testimonial", subject: testimonial.name, subjectId: id, userId: session.user.id, userDisplay: session.user.name || session.user.email || "System Admin" })
    return { testimonial, message: "Testimonial updated" }
  }, { path: "/api/v1/access-control/landing/testimonials/[id]", method: "PUT" })
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  return withErrorHandling(async () => {
    const session = await requirePermission("landing.update")
    const { id } = await params
    const testimonial = await prisma.landingTestimonial.delete({ where: { id } })
    await createActivityLog({ type: "landing", activity: "Removed a testimonial", subject: testimonial.name, subjectId: id, userId: session.user.id, userDisplay: session.user.name || session.user.email || "System Admin" })
    return { message: "Testimonial removed" }
  }, { path: "/api/v1/access-control/landing/testimonials/[id]", method: "DELETE" })
}
