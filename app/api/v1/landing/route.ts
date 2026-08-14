import { NextRequest } from "next/server"

import { withErrorHandling } from "@/lib/error-handler"
import { sendConfiguredEmail, textToHtml } from "@/lib/email/email.service"
import { getLandingContent } from "@/lib/landing"
import { prisma } from "@/lib/prisma"
import { landingContactSchema } from "@/lib/validations/landing"

export async function GET() {
  return withErrorHandling(async () => {
    const content = await getLandingContent()
    return { landing: content }
  }, { path: "/api/v1/landing", method: "GET" })
}

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const payload = landingContactSchema.parse(await request.json())
    const message = await prisma.landingContactMessage.create({ data: payload })
    const { page } = await getLandingContent({ includeDrafts: true })
    const recipient = page.contactEmail?.trim()
    let emailDelivered = false

    if (recipient) {
      const text = [
        `New AflaxFiness website enquiry from ${payload.name}`,
        `Email: ${payload.email}`,
        `Phone: ${payload.phone || "Not provided"}`,
        "",
        payload.message,
      ].join("\n")
      try {
        await sendConfiguredEmail({
          to: recipient,
          subject: `New website enquiry from ${payload.name}`,
          text,
          html: textToHtml(text),
        })
        emailDelivered = true
      } catch (error) {
        console.error("Website contact email delivery failed", error)
      }
    }

    return {
      message: emailDelivered ? "Thank you. Your message has been sent." : "Thank you. Your message has been received and is now in our contact inbox.",
      contactMessage: message,
      emailDelivered,
    }
  }, { path: "/api/v1/landing", method: "POST" })
}
