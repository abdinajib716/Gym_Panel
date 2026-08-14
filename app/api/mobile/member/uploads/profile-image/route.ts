import { NextRequest } from "next/server"

import { AppError, withErrorHandling } from "@/lib/error-handler"
import { requireMobileMember } from "@/lib/mobile-member"
import { prisma } from "@/lib/prisma"
import { uploadImage } from "@/lib/uploads"

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileMember(request)
    const file = (await request.formData()).get("file")

    if (!(file instanceof File)) throw new AppError(400, "Image file is required")

    const { url: profileImage } = await uploadImage(file, { folder: "profile-images" })
    const member = await prisma.member.update({
      where: { id: account.memberId },
      data: { profileImage },
    })

    return { success: true, url: profileImage, profileImage, member, message: "Profile image updated successfully" }
  }, { path: "/api/mobile/member/uploads/profile-image", method: "POST" })
}
