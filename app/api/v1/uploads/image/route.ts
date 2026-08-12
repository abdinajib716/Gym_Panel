import { randomUUID } from "node:crypto"
import { NextRequest } from "next/server"
import { put } from "@vercel/blob"

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

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new AppError(503, "Image storage is not configured. Add BLOB_READ_WRITE_TOKEN to this environment.")
    }

    const fileName = `${Date.now()}-${randomUUID()}${extension}`
    const blob = await put(`access-control/${fileName}`, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
    })

    return {
      url: blob.url,
      fileName,
    }
  }, { path: "/api/v1/uploads/image", method: "POST" })
}
