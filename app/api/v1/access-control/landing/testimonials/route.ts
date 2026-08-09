import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"
import { landingTestimonialSchema } from "@/lib/validations/landing"

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const session = await requirePermission("landing.update")
    const payload = landingTestimonialSchema.parse(await request.json())
    const latest = await prisma.landingTestimonial.aggregate({ _max: { position: true } })
    const testimonial = await prisma.landingTestimonial.create({ data: { ...payload, position: (latest._max.position ?? -1) + 1 } })
    await createActivityLog({ type: "landing", activity: "Added a testimonial", subject: testimonial.name, subjectId: testimonial.id, userId: session.user.id, userDisplay: session.user.name || session.user.email || "System Admin" })
    return { testimonial, message: "Testimonial added" }
  }, { path: "/api/v1/access-control/landing/testimonials", method: "POST" })
}
