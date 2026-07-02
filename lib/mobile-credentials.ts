import crypto from "node:crypto"

import bcrypt from "bcryptjs"

import { createActivityLog } from "@/lib/access-control"
import { AppError } from "@/lib/error-handler"
import { memberWelcomeEmail, trainerWelcomeEmail } from "@/lib/email/templates"
import { sendConfiguredEmail } from "@/lib/email/email.service"
import { prisma } from "@/lib/prisma"

type Actor = {
  id?: string
  name?: string | null
  email?: string | null
}

function encryptionKey() {
  return crypto.createHash("sha256").update(process.env.NEXTAUTH_SECRET || "gym-management-secret").digest()
}

export function encryptTemporaryPassword(value: string) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`
}

export function decryptTemporaryPassword(value?: string | null) {
  if (!value) return null
  const [ivValue, tagValue, encryptedValue] = value.split(":")
  if (!ivValue || !tagValue || !encryptedValue) return null

  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivValue, "base64"))
  decipher.setAuthTag(Buffer.from(tagValue, "base64"))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64")),
    decipher.final(),
  ])
  return decrypted.toString("utf8")
}

export function generateTemporaryPassword() {
  return `GYM-${crypto.randomInt(100000, 999999)}`
}

function username(email?: string | null, phone?: string | null) {
  return email || phone || ""
}

function userDisplay(actor?: Actor) {
  return actor?.name || actor?.email || "System Admin"
}

export function safeMobileAccount(account: {
  id: string
  role: string
  loginEmail: string | null
  loginPhone: string | null
  mustChangePassword: boolean
  passwordChangedAt: Date | null
  lastLoginAt: Date | null
  accountStatus: string
  welcomeEmailSentAt: Date | null
  welcomeEmailError: string | null
}) {
  return {
    id: account.id,
    role: account.role,
    loginEmail: account.loginEmail,
    loginPhone: account.loginPhone,
    username: username(account.loginEmail, account.loginPhone),
    mustChangePassword: account.mustChangePassword,
    passwordChangedAt: account.passwordChangedAt,
    lastLoginAt: account.lastLoginAt,
    accountStatus: account.accountStatus,
    welcomeEmailSentAt: account.welcomeEmailSentAt,
    welcomeEmailError: account.welcomeEmailError,
    hasTemporaryPassword: !account.passwordChangedAt,
  }
}

export async function createMemberMobileAccount(input: {
  memberId: string
  actor?: Actor
}) {
  const member = await prisma.member.findUnique({
    where: { id: input.memberId },
    include: {
      mobileAccount: true,
      subscriptions: { orderBy: { createdAt: "desc" }, take: 1, include: { plan: true } },
    },
  })

  if (!member) throw new AppError(404, "Member not found")
  if (member.mobileAccount) return { account: member.mobileAccount, temporaryPassword: null, emailStatus: "existing" as const }

  const temporaryPassword = generateTemporaryPassword()
  const passwordHash = await bcrypt.hash(temporaryPassword, 10)

  const account = await prisma.mobileAccount.create({
    data: {
      role: "MEMBER",
      memberId: member.id,
      loginEmail: member.email,
      loginPhone: member.phoneNumber,
      passwordHash,
      temporaryPasswordEncrypted: encryptTemporaryPassword(temporaryPassword),
      mustChangePassword: true,
      accountStatus: "ACTIVE",
    },
  })

  await createActivityLog({
    type: "member_credentials",
    activity: "Created member mobile login account",
    subject: member.fullName,
    subjectId: member.id,
    userId: input.actor?.id,
    userDisplay: userDisplay(input.actor),
  })

  const emailStatus = await sendMemberWelcomeEmail(member.id, input.actor, temporaryPassword)
  return { account, temporaryPassword, emailStatus }
}

export async function createTrainerMobileAccount(input: {
  trainerId: string
  actor?: Actor
}) {
  const trainer = await prisma.trainer.findUnique({
    where: { id: input.trainerId },
    include: { mobileAccount: true },
  })

  if (!trainer) throw new AppError(404, "Trainer not found")
  if (trainer.mobileAccount) return { account: trainer.mobileAccount, temporaryPassword: null, emailStatus: "existing" as const }

  const temporaryPassword = generateTemporaryPassword()
  const passwordHash = await bcrypt.hash(temporaryPassword, 10)

  const account = await prisma.mobileAccount.create({
    data: {
      role: "TRAINER",
      trainerId: trainer.id,
      loginEmail: trainer.email,
      loginPhone: trainer.phoneNumber,
      passwordHash,
      temporaryPasswordEncrypted: encryptTemporaryPassword(temporaryPassword),
      mustChangePassword: true,
      accountStatus: trainer.status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
    },
  })

  await createActivityLog({
    type: "trainer_credentials",
    activity: "Created trainer mobile login account",
    subject: trainer.fullName,
    subjectId: trainer.id,
    userId: input.actor?.id,
    userDisplay: userDisplay(input.actor),
  })

  const emailStatus = await sendTrainerWelcomeEmail(trainer.id, input.actor, temporaryPassword)
  return { account, temporaryPassword, emailStatus }
}

export async function sendMemberWelcomeEmail(memberId: string, actor?: Actor, knownTemporaryPassword?: string | null) {
  const [settings, member] = await Promise.all([
    prisma.accessControlSettings.findUnique({ where: { key: "global" } }),
    prisma.member.findUnique({
      where: { id: memberId },
      include: { mobileAccount: true, subscriptions: { orderBy: { createdAt: "desc" }, take: 1, include: { plan: true } } },
    }),
  ])

  if (!member?.mobileAccount) throw new AppError(404, "Member login account not found")
  if (!member.email) return "missing_email" as const

  const temporaryPassword = knownTemporaryPassword || decryptTemporaryPassword(member.mobileAccount.temporaryPasswordEncrypted)
  if (!temporaryPassword) throw new AppError(400, "Temporary password is no longer available")

  const subscription = member.subscriptions[0]
  const template = memberWelcomeEmail({
    gymName: settings?.siteName || "Gym",
    name: member.fullName,
    email: member.email,
    phone: member.phoneNumber,
    planName: subscription?.plan?.name,
    subscriptionStatus: subscription?.status,
    startDate: subscription?.startDate,
    expiryDate: subscription?.expiryDate,
    username: username(member.email, member.phoneNumber),
    temporaryPassword,
  })

  try {
    await sendConfiguredEmail({ to: member.email, ...template })
    await prisma.mobileAccount.update({
      where: { id: member.mobileAccount.id },
      data: { welcomeEmailSentAt: new Date(), welcomeEmailError: null },
    })
    return "sent" as const
  } catch (error) {
    const message = error instanceof Error ? error.message : "Welcome email failed"
    await prisma.mobileAccount.update({
      where: { id: member.mobileAccount.id },
      data: { welcomeEmailError: message },
    })
    await createActivityLog({
      type: "member_credentials",
      activity: "Member welcome email failed",
      subject: member.fullName,
      subjectId: member.id,
      userId: actor?.id,
      userDisplay: userDisplay(actor),
      metadata: { error: message },
    })
    return "failed" as const
  }
}

export async function sendTrainerWelcomeEmail(trainerId: string, actor?: Actor, knownTemporaryPassword?: string | null) {
  const [settings, trainer] = await Promise.all([
    prisma.accessControlSettings.findUnique({ where: { key: "global" } }),
    prisma.trainer.findUnique({ where: { id: trainerId }, include: { mobileAccount: true } }),
  ])

  if (!trainer?.mobileAccount) throw new AppError(404, "Trainer login account not found")
  if (!trainer.email) return "missing_email" as const

  const temporaryPassword = knownTemporaryPassword || decryptTemporaryPassword(trainer.mobileAccount.temporaryPasswordEncrypted)
  if (!temporaryPassword) throw new AppError(400, "Temporary password is no longer available")

  const template = trainerWelcomeEmail({
    gymName: settings?.siteName || "Gym",
    name: trainer.fullName,
    email: trainer.email,
    phone: trainer.phoneNumber,
    specialty: trainer.specialty,
    status: trainer.status,
    username: username(trainer.email, trainer.phoneNumber),
    temporaryPassword,
  })

  try {
    await sendConfiguredEmail({ to: trainer.email, ...template })
    await prisma.mobileAccount.update({
      where: { id: trainer.mobileAccount.id },
      data: { welcomeEmailSentAt: new Date(), welcomeEmailError: null },
    })
    return "sent" as const
  } catch (error) {
    const message = error instanceof Error ? error.message : "Welcome email failed"
    await prisma.mobileAccount.update({
      where: { id: trainer.mobileAccount.id },
      data: { welcomeEmailError: message },
    })
    await createActivityLog({
      type: "trainer_credentials",
      activity: "Trainer welcome email failed",
      subject: trainer.fullName,
      subjectId: trainer.id,
      userId: actor?.id,
      userDisplay: userDisplay(actor),
      metadata: { error: message },
    })
    return "failed" as const
  }
}

export function credentialMessage(entity: "Member" | "Trainer", emailStatus: "sent" | "missing_email" | "failed" | "existing") {
  if (emailStatus === "sent") return `${entity} created successfully. Welcome email sent.`
  if (emailStatus === "missing_email") return `${entity} created successfully. No email was sent because email is missing. Login details are available in View Details.`
  if (emailStatus === "failed") return `${entity} created successfully, but welcome email failed. Login details are available in View Details.`
  return `${entity} created successfully. Login account already exists.`
}

export async function getMemberLoginDetails(memberId: string, actor?: Actor) {
  const member = await prisma.member.findUnique({ where: { id: memberId }, include: { mobileAccount: true } })
  if (!member?.mobileAccount) throw new AppError(404, "Member login account not found")

  await createActivityLog({
    type: "member_credentials",
    activity: "Viewed member login credentials",
    subject: member.fullName,
    subjectId: member.id,
    userId: actor?.id,
    userDisplay: userDisplay(actor),
  })

  return {
    account: safeMobileAccount(member.mobileAccount),
    temporaryPassword: decryptTemporaryPassword(member.mobileAccount.temporaryPasswordEncrypted),
  }
}

export async function getTrainerLoginDetails(trainerId: string, actor?: Actor) {
  const trainer = await prisma.trainer.findUnique({ where: { id: trainerId }, include: { mobileAccount: true } })
  if (!trainer?.mobileAccount) throw new AppError(404, "Trainer login account not found")

  await createActivityLog({
    type: "trainer_credentials",
    activity: "Viewed trainer login credentials",
    subject: trainer.fullName,
    subjectId: trainer.id,
    userId: actor?.id,
    userDisplay: userDisplay(actor),
  })

  return {
    account: safeMobileAccount(trainer.mobileAccount),
    temporaryPassword: decryptTemporaryPassword(trainer.mobileAccount.temporaryPasswordEncrypted),
  }
}

export async function resetTrainerTemporaryPassword(trainerId: string, actor?: Actor) {
  const trainer = await prisma.trainer.findUnique({ where: { id: trainerId }, include: { mobileAccount: true } })
  if (!trainer?.mobileAccount) throw new AppError(404, "Trainer login account not found")
  const temporaryPassword = generateTemporaryPassword()
  await prisma.mobileAccount.update({
    where: { id: trainer.mobileAccount.id },
    data: {
      passwordHash: await bcrypt.hash(temporaryPassword, 10),
      temporaryPasswordEncrypted: encryptTemporaryPassword(temporaryPassword),
      mustChangePassword: true,
      passwordChangedAt: null,
    },
  })
  await createActivityLog({ type: "trainer_credentials", activity: "Reset trainer temporary password", subject: trainer.fullName, subjectId: trainer.id, userId: actor?.id, userDisplay: userDisplay(actor) })
  const emailStatus = await sendTrainerWelcomeEmail(trainer.id, actor, temporaryPassword)
  return { temporaryPassword, emailStatus }
}
