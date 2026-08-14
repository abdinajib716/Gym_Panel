import { NextRequest } from "next/server"

import { requireAuth } from "@/lib/auth"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { uploadImage } from "@/lib/uploads"

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    await requireAuth()

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      throw new AppError(400, "Image file is required")
    }

    return uploadImage(file, { folder: "access-control" })
  }, { path: "/api/v1/uploads/image", method: "POST" })
}
