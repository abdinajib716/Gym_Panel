import crypto from "node:crypto"

import bcrypt from "bcryptjs"
import { NextRequest } from "next/server"

import { AppError } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url")
}

function sign(value: string) {
  return crypto.createHmac("sha256", process.env.NEXTAUTH_SECRET || "mobile-auth-secret").update(value).digest("base64url")
}

export function createMobileToken(input: { accountId: string; role: "MEMBER" | "TRAINER" }) {
  const payload = {
    sub: input.accountId,
    role: input.role,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  }
  const encoded = base64url(JSON.stringify(payload))
  return `${encoded}.${sign(encoded)}`
}

export function verifyMobileToken(token: string) {
  const [encoded, signature] = token.split(".")
  if (!encoded || !signature || sign(encoded) !== signature) {
    throw new AppError(401, "Invalid mobile token")
  }

  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as {
    sub?: string
    role?: "MEMBER" | "TRAINER"
    exp?: number
  }

  if (!payload.sub || !payload.role || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new AppError(401, "Expired mobile token")
  }

  return payload
}

export async function requireMobileAccount(request: NextRequest) {
  const header = request.headers.get("authorization") || ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : ""
  if (!token) throw new AppError(401, "Mobile authentication required")

  const payload = verifyMobileToken(token)
  const account = await prisma.mobileAccount.findUnique({
    where: { id: payload.sub },
    include: { member: true, trainer: true },
  })

  if (!account || account.accountStatus !== "ACTIVE") {
    throw new AppError(401, "Mobile account is not active")
  }

  return account
}

export async function findMobileAccount(identifier: string) {
  const value = identifier.trim().toLowerCase()
  const digits = value.replace(/\D/g, "")
  const phoneCandidates = new Set<string>()

  if (digits) {
    phoneCandidates.add(digits)
    if (digits.startsWith("252")) {
      phoneCandidates.add(`0${digits.slice(3)}`)
      phoneCandidates.add(digits.slice(3))
    } else if (digits.startsWith("0")) {
      phoneCandidates.add(digits.slice(1))
      phoneCandidates.add(`252${digits.slice(1)}`)
    } else {
      phoneCandidates.add(`252${digits}`)
      phoneCandidates.add(`0${digits}`)
    }
  }

  return prisma.mobileAccount.findFirst({
    where: {
      OR: [
        { loginEmail: { equals: value, mode: "insensitive" } },
        { loginPhone: { in: [value, ...phoneCandidates] } },
      ],
    },
    include: { member: true, trainer: true },
  })
}

export async function validateMobileLogin(identifier: string, password: string) {
  const account = await findMobileAccount(identifier)
  if (!account || account.accountStatus !== "ACTIVE") {
    throw new AppError(401, "Invalid login credentials")
  }

  const ok = await bcrypt.compare(password, account.passwordHash)
  if (!ok) throw new AppError(401, "Invalid login credentials")

  await prisma.mobileAccount.update({
    where: { id: account.id },
    data: { lastLoginAt: new Date() },
  })

  return account
}

export function mobileProfile(account: Awaited<ReturnType<typeof requireMobileAccount>>) {
  const person = account.role === "MEMBER" ? account.member : account.trainer
  return {
    id: person?.id,
    accountId: account.id,
    role: account.role,
    name: person?.fullName,
    email: account.loginEmail,
    phone: account.loginPhone,
    accountStatus: account.accountStatus,
    mustChangePassword: account.mustChangePassword,
  }
}

export async function resetMobilePassword(accountId: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.mobileAccount.update({
    where: { id: accountId },
    data: {
      passwordHash,
      mustChangePassword: false,
      passwordChangedAt: new Date(),
      temporaryPasswordEncrypted: null,
    },
  })
}
