"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { ImageUp, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { apiRequest } from "@/lib/client-api"

export function LocalImageUpload({
  label,
  hint,
  value,
  error,
  onChange,
}: {
  label: string
  hint?: string
  value?: string
  error?: string
  onChange: (value: string) => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    setImageFailed(false)
  }, [value])

  const handleSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    const formData = new FormData()
    formData.append("file", selectedFile)

    setUploading(true)
    try {
      const response = await apiRequest<{ url: string }>("/api/v1/uploads/image", {
        method: "POST",
        body: formData,
      })
      onChange(response.url)
      toast.success("Image uploaded successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload image")
    } finally {
      setUploading(false)
      event.target.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="flex items-start gap-4 rounded-xl border border-border/70 bg-background px-4 py-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-border/70 bg-muted/35">
          {value && !imageFailed ? (
            <Image src={value} alt={label} width={64} height={64} className="h-full w-full object-cover" onError={() => setImageFailed(true)} />
          ) : (
            <ImageUp className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleSelect} />
          <Button type="button" variant="outline" className="gap-2" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? <Spinner /> : <Upload className="h-4 w-4" />}
            {uploading ? "Uploading..." : "Upload image"}
          </Button>
          {value ? (
            <Button type="button" variant="ghost" className="gap-2 text-destructive hover:text-destructive" onClick={() => onChange("")}>
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          ) : null}
        </div>
      </div>
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  )
}
