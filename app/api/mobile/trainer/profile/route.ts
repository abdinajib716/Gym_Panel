import { NextRequest } from "next/server"
import { withErrorHandling } from "@/lib/error-handler"
import { requireMobileTrainer } from "@/lib/mobile-trainer"
import { prisma } from "@/lib/prisma"
import { trainerUpdateSchema } from "@/lib/validations/gym"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    return { success: true, trainer: { ...account.trainer, account: { email: account.loginEmail, phone: account.loginPhone, mustChangePassword: account.mustChangePassword, lastLoginAt: account.lastLoginAt } } }
  }, { path: "/api/mobile/trainer/profile", method: "GET" })
}

export async function PUT(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const payload = trainerUpdateSchema.pick({ fullName: true, phoneNumber: true, email: true, gender: true, specialty: true, availability: true, profileImage: true }).parse(await request.json())
    const trainer = await prisma.trainer.update({ where: { id: account.trainerId }, data: payload })
    await prisma.mobileAccount.update({ where: { id: account.id }, data: { loginEmail: trainer.email, loginPhone: trainer.phoneNumber } })
    return { success: true, trainer, message: "Profile updated successfully" }
  }, { path: "/api/mobile/trainer/profile", method: "PUT" })
}
