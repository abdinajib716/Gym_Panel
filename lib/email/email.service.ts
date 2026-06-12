import nodemailer from "nodemailer"

import { AppError } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"

export type EmailPayload = {
  to: string
  subject: string
  text: string
  html?: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

export function textToHtml(text: string) {
  return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;white-space:pre-line">${escapeHtml(text)}</div>`
}

export async function getEmailSettings() {
  const settings = await prisma.accessControlSettings.findUnique({
    where: { key: "global" },
  })

  if (!settings) {
    throw new AppError(404, "Email settings not found")
  }

  return settings
}

export async function sendConfiguredEmail(payload: EmailPayload) {
  const settings = await getEmailSettings()

  if (!settings.fromEmail) {
    throw new AppError(400, "From email is missing in Email Configuration")
  }

  if (settings.mailDriver !== "smtp") {
    throw new AppError(400, "Only SMTP email sending is currently supported")
  }

  if (!settings.smtpHost || !settings.smtpPort || !settings.smtpUsername || !settings.smtpPassword) {
    throw new AppError(400, "SMTP configuration is incomplete")
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.encryption === "ssl",
    auth: {
      user: settings.smtpUsername,
      pass: settings.smtpPassword,
    },
    requireTLS: settings.encryption === "tls",
  })

  const fromName = settings.fromName || settings.siteName || "Gym Admin"

  const result = await transporter.sendMail({
    from: `"${fromName.replaceAll('"', "'")}" <${settings.fromEmail}>`,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html || textToHtml(payload.text),
  })

  return {
    messageId: result.messageId,
    accepted: result.accepted,
    rejected: result.rejected,
  }
}
