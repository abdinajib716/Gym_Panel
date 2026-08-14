import { NextRequest } from "next/server"

import { AppError, withErrorHandling } from "@/lib/error-handler"
import { requireMobileTrainer } from "@/lib/mobile-trainer"
import { prisma } from "@/lib/prisma"
import { uploadImage } from "@/lib/uploads"

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileTrainer(request)
    const file = (await request.formData()).get("file")

    if (!(file instanceof File)) throw new AppError(400, "Image file is required")

    const { url: profileImage } = await uploadImage(file, { folder: "profile-images" })
    const trainer = await prisma.trainer.update({
      where: { id: account.trainerId },
      data: { profileImage },
    })

    return { success: true, url: profileImage, profileImage, trainer, message: "Profile image updated successfully" }
  }, { path: "/api/mobile/trainer/uploads/profile-image", method: "POST" })
}
