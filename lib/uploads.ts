import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

import { put } from "@vercel/blob"

import { AppError } from "@/lib/error-handler"

const imageExtensions = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
])

type ImageUploadOptions = {
  folder: "access-control" | "profile-images" | "workouts"
  maxSizeBytes?: number
}

/**
 * Stores an image durably in Vercel Blob when configured. The filesystem
 * fallback keeps local development simple, but is intentionally rejected on
 * Vercel because its filesystem is not persistent between deployments.
 */
export async function uploadImage(file: File, { folder, maxSizeBytes = 2 * 1024 * 1024 }: ImageUploadOptions) {
  const extension = imageExtensions.get(file.type)
  if (!extension) {
    throw new AppError(400, "Only JPG, PNG, and WEBP images are supported")
  }
  if (file.size > maxSizeBytes) {
    throw new AppError(400, `Image size must be ${Math.floor(maxSizeBytes / 1024 / 1024)}MB or less`)
  }

  const fileName = `${Date.now()}-${randomUUID()}${extension}`
  const blobPath = `${folder}/${fileName}`

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(blobPath, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
    })
    return { url: blob.url, fileName }
  }

  if (process.env.VERCEL) {
    throw new AppError(500, "Image storage is not configured. Add BLOB_READ_WRITE_TOKEN to the deployment environment.")
  }

  const directory = path.join(process.cwd(), "public", "uploads", folder)
  await mkdir(directory, { recursive: true })
  await writeFile(path.join(directory, fileName), Buffer.from(await file.arrayBuffer()))
  return { url: `/uploads/${blobPath}`, fileName }
}
