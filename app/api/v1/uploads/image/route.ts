import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { NextRequest } from "next/server"

import { requireAuth } from "@/lib/auth"
import { AppError, withErrorHandling } from "@/lib/error-handler"

const allowedTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
])

const maxFileSizeBytes = 2 * 1024 * 1024

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    await requireAuth()

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      throw new AppError(400, "Image file is required")
    }

    const extension = allowedTypes.get(file.type)
    if (!extension) {
      throw new AppError(400, "Only JPG, PNG, and WEBP images are supported")
    }

    if (file.size > maxFileSizeBytes) {
      throw new AppError(400, "Image size must be 2MB or less")
    }

    const uploadDirectory = path.join(process.cwd(), "public", "uploads", "access-control")
    await mkdir(uploadDirectory, { recursive: true })

    const fileName = `${Date.now()}-${randomUUID()}${extension}`
    const filePath = path.join(uploadDirectory, fileName)
    const bytes = Buffer.from(await file.arrayBuffer())

    await writeFile(filePath, bytes)

    return {
      url: `/uploads/access-control/${fileName}`,
      fileName,
    }
  }, { path: "/api/v1/uploads/image", method: "POST" })
}
