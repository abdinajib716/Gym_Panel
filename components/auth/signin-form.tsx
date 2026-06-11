"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { LockKeyhole, Mail } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

export function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
  }>({})

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: { email?: string; password?: string } = {}

    if (!email.trim()) {
      nextErrors.email = "User email is required"
    }

    if (!password.trim()) {
      nextErrors.password = "Password is required"
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      })

      if (!result || result.error) {
        toast.error(result?.error || "Invalid email or password")
      } else {
        toast.success("Signed in successfully")
        router.replace(result.url || callbackUrl)
        router.refresh()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md rounded-2xl border border-border/70 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.45)]">
      <CardHeader className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Superadmin access</p>
        <CardTitle className="text-3xl" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          Sign in
        </CardTitle>
        <p className="text-sm text-muted-foreground">Use the seeded superadmin account to enter the protected dashboard.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="space-y-2">
            <span className="text-sm font-medium">User Email</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  if (errors.email) {
                    setErrors((current) => ({ ...current, email: undefined }))
                  }
                }}
                className="pl-9"
                placeholder="Enter your email"
                aria-invalid={Boolean(errors.email)}
              />
            </div>
            {errors.email ? <p className="text-xs font-medium text-destructive">{errors.email}</p> : null}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium">Password</span>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  if (errors.password) {
                    setErrors((current) => ({ ...current, password: undefined }))
                  }
                }}
                className="pl-9"
                placeholder="Enter your password"
                aria-invalid={Boolean(errors.password)}
              />
            </div>
            {errors.password ? <p className="text-xs font-medium text-destructive">{errors.password}</p> : null}
          </label>

          <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="size-4" /> : null}
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
