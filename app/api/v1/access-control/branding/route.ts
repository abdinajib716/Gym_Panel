import { existsSync } from "node:fs"
import path from "node:path"

import { withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"

const imageFields = ["siteLogoFullLight", "siteLogoFullDark", "siteIcon", "siteFavicon", "loginPageLogo"] as const

function localUploadExists(value: string | null) {
  if (!value?.startsWith("/uploads/")) return true
  const relativePath = value.replace(/^\/+/, "")
  return existsSync(path.join(process.cwd(), "public", relativePath))
}

export async function GET() {
  return withErrorHandling(async () => {
    const settings = await prisma.accessControlSettings.upsert({
      where: { key: "global" },
      update: {},
      create: {
        key: "global",
        siteName: "Startap Admin",
        themeMode: "system",
        primaryColor: "#2f8fe8",
        sidebarStyle: "default",
        layoutWidth: "boxed",
        headerStyle: "sticky",
        mailDriver: "smtp",
        fromName: "Startap Admin",
        fromEmail: "hello@startap.dev",
        smtpHost: "smtp.mailtrap.io",
        smtpPort: 587,
        smtpUsername: "mailer-user",
        smtpPassword: "mailer-password",
        encryption: "tls",
      },
      select: {
        siteName: true,
        siteLogoFullLight: true,
        siteLogoFullDark: true,
        siteIcon: true,
        siteFavicon: true,
        loginPageLogo: true,
      },
    })

    if (!settings) {
      return { branding: null }
    }

    const sanitized = { ...settings }
    const missingPatch: Partial<Record<(typeof imageFields)[number], null>> = {}

    for (const field of imageFields) {
      if (!localUploadExists(sanitized[field])) {
        sanitized[field] = null
        missingPatch[field] = null
      }
    }

    if (Object.keys(missingPatch).length > 0) {
      await prisma.accessControlSettings.update({
        where: { key: "global" },
        data: missingPatch,
      })
    }

    return {
      branding: sanitized,
    }
  }, { path: "/api/v1/access-control/branding", method: "GET" })
}
