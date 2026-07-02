import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { NextRequest } from "next/server"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { requireMobileTrainer } from "@/lib/mobile-trainer"

const allowedTypes = new Map([["image/jpeg", ".jpg"], ["image/png", ".png"], ["image/webp", ".webp"]])

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    await requireMobileTrainer(request)
    const file = (await request.formData()).get("file")
    if (!(file instanceof File)) throw new AppError(400, "Image file is required")
    const extension = allowedTypes.get(file.type)
    if (!extension) throw new AppError(400, "Only JPG, PNG, and WEBP images are supported")
    if (file.size > 5 * 1024 * 1024) throw new AppError(400, "Image size must be 5MB or less")
    const directory = path.join(process.cwd(), "public", "uploads", "workouts")
    await mkdir(directory, { recursive: true })
    const fileName = `${Date.now()}-${randomUUID()}${extension}`
    await writeFile(path.join(directory, fileName), Buffer.from(await file.arrayBuffer()))
    return { success: true, url: `/uploads/workouts/${fileName}`, fileName }
  }, { path: "/api/mobile/trainer/uploads/image", method: "POST" })
}
