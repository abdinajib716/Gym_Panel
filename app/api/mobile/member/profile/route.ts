import { NextRequest } from "next/server"

import { withErrorHandling } from "@/lib/error-handler"
import { requireMobileMember } from "@/lib/mobile-member"
import { prisma } from "@/lib/prisma"
import { memberUpdateSchema } from "@/lib/validations/gym"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileMember(request)
    return {
      success: true,
      member: {
        ...account.member,
        account: {
          email: account.loginEmail,
          phone: account.loginPhone,
          mustChangePassword: account.mustChangePassword,
          lastLoginAt: account.lastLoginAt,
        },
      },
    }
  }, { path: "/api/mobile/member/profile", method: "GET" })
}

export async function PUT(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileMember(request)
    const payload = memberUpdateSchema
      .pick({
        fullName: true,
        phoneNumber: true,
        email: true,
        gender: true,
        address: true,
        dateOfBirth: true,
        emergencyContact: true,
        profileImage: true,
      })
      .parse(await request.json())

    const member = await prisma.member.update({
      where: { id: account.memberId },
      data: {
        ...(payload.fullName !== undefined ? { fullName: payload.fullName } : {}),
        ...(payload.phoneNumber !== undefined ? { phoneNumber: payload.phoneNumber } : {}),
        ...(payload.email !== undefined ? { email: payload.email || null } : {}),
        ...(payload.gender !== undefined ? { gender: payload.gender } : {}),
        ...(payload.address !== undefined ? { address: payload.address || null } : {}),
        ...(payload.dateOfBirth !== undefined ? { dateOfBirth: payload.dateOfBirth ? new Date(payload.dateOfBirth) : null } : {}),
        ...(payload.emergencyContact !== undefined ? { emergencyContact: payload.emergencyContact || null } : {}),
        ...(payload.profileImage !== undefined ? { profileImage: payload.profileImage || null } : {}),
      },
    })

    await prisma.mobileAccount.update({
      where: { id: account.id },
      data: { loginEmail: member.email, loginPhone: member.phoneNumber },
    })

    return { success: true, member, message: "Profile updated successfully" }
  }, { path: "/api/mobile/member/profile", method: "PUT" })
}
