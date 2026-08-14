import { NextRequest } from "next/server"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { requireMobileTrainer } from "@/lib/mobile-trainer"
import { uploadImage } from "@/lib/uploads"

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    await requireMobileTrainer(request)
    const file = (await request.formData()).get("file")
    if (!(file instanceof File)) throw new AppError(400, "Image file is required")
    const upload = await uploadImage(file, { folder: "workouts", maxSizeBytes: 5 * 1024 * 1024 })
    return { success: true, ...upload }
  }, { path: "/api/mobile/trainer/uploads/image", method: "POST" })
}
