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
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  })

  const fromName = settings.fromName || settings.siteName || "Gym Admin"

  let result: Awaited<ReturnType<typeof transporter.sendMail>>

  try {
    await transporter.verify()
    result = await transporter.sendMail({
      from: `"${fromName.replaceAll('"', "'")}" <${settings.fromEmail}>`,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html || textToHtml(payload.text),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown SMTP error"
    throw new AppError(502, `Email delivery failed: ${message}`, "EMAIL_DELIVERY_FAILED")
  }

  if (result.rejected.length > 0) {
    throw new AppError(502, `Email rejected for ${result.rejected.join(", ")}`, "EMAIL_REJECTED")
  }

  return {
    messageId: result.messageId,
    accepted: result.accepted,
    rejected: result.rejected,
  }
}
