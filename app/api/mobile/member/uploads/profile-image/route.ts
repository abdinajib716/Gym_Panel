import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

import { NextRequest } from "next/server"

import { AppError, withErrorHandling } from "@/lib/error-handler"
import { requireMobileMember } from "@/lib/mobile-member"
import { prisma } from "@/lib/prisma"

const allowedTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
])

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const account = await requireMobileMember(request)
    const file = (await request.formData()).get("file")

    if (!(file instanceof File)) throw new AppError(400, "Image file is required")

    const extension = allowedTypes.get(file.type)
    if (!extension) throw new AppError(400, "Only JPG, PNG, and WEBP images are supported")
    if (file.size > 2 * 1024 * 1024) throw new AppError(400, "Image size must be 2MB or less")

    const directory = path.join(process.cwd(), "public", "uploads", "profile-images")
    await mkdir(directory, { recursive: true })

    const fileName = `${Date.now()}-${randomUUID()}${extension}`
    await writeFile(path.join(directory, fileName), Buffer.from(await file.arrayBuffer()))

    const profileImage = `/api/uploads/profile-images/${fileName}`
    const member = await prisma.member.update({
      where: { id: account.memberId },
      data: { profileImage },
    })

    return { success: true, url: profileImage, profileImage, member, message: "Profile image updated successfully" }
  }, { path: "/api/mobile/member/uploads/profile-image", method: "POST" })
}
