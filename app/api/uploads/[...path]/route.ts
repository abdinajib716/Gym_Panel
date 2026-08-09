import { readFile, stat } from "node:fs/promises"
import path from "node:path"

import { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

const contentTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
}

function resolveUploadPath(segments: string[]) {
  const uploadsRoot = path.join(process.cwd(), "public", "uploads")
  const filePath = path.normalize(path.join(uploadsRoot, ...segments))

  if (!filePath.startsWith(`${uploadsRoot}${path.sep}`)) {
    return null
  }

  return filePath
}

async function serveUpload(segments: string[], headOnly = false) {
  const filePath = resolveUploadPath(segments)
  if (!filePath) return new Response("Not found", { status: 404 })

  try {
    const fileStat = await stat(filePath)
    if (!fileStat.isFile()) return new Response("Not found", { status: 404 })

    const extension = path.extname(filePath).toLowerCase()
    const headers = new Headers({
      "Content-Type": contentTypes[extension] || "application/octet-stream",
      "Content-Length": String(fileStat.size),
      "Cache-Control": "public, max-age=0, must-revalidate",
    })

    if (headOnly) return new Response(null, { status: 200, headers })

    const file = await readFile(filePath)
    return new Response(file, { status: 200, headers })
  } catch {
    return new Response("Not found", { status: 404 })
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params
  return serveUpload(segments)
}

export async function HEAD(_request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params
  return serveUpload(segments, true)
}
