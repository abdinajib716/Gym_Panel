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
import { apiRequest } from "@/lib/client-api"

type AuthMode = "signin" | "forgot" | "reset"

export function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mode, setMode] = useState<AuthMode>("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [resetCode, setResetCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    resetCode?: string
    newPassword?: string
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

  const handleForgotPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email.trim()) {
      setErrors({ email: "User email is required" })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await apiRequest<{ message: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: { email },
      })
      toast.success(response.message)
      setMode("reset")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send reset code")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors: typeof errors = {}

    if (!email.trim()) nextErrors.email = "User email is required"
    if (!resetCode.trim()) nextErrors.resetCode = "Reset code is required"
    if (!newPassword.trim()) nextErrors.newPassword = "New password is required"
    if (newPassword && newPassword.length < 8) nextErrors.newPassword = "Password must be at least 8 characters"

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    try {
      const response = await apiRequest<{ message: string }>("/api/auth/reset-password", {
        method: "POST",
        body: { email, code: resetCode, password: newPassword },
      })
      toast.success(response.message)
      setPassword("")
      setNewPassword("")
      setResetCode("")
      setMode("signin")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reset password")
    } finally {
      setIsSubmitting(false)
    }
  }

  const title = mode === "signin" ? "Sign in" : mode === "forgot" ? "Forgot password" : "Reset password"
  const description = mode === "signin"
    ? "Use your admin account to enter the protected dashboard."
    : mode === "forgot"
      ? "Enter your admin email and we will send a reset code."
      : "Enter the code from your email and choose a new password."

  return (
    <Card className="w-full max-w-md rounded-2xl border border-border/70 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.45)]">
      <CardHeader className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Superadmin access</p>
        <CardTitle className="text-3xl" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={mode === "signin" ? handleSubmit : mode === "forgot" ? handleForgotPassword : handleResetPassword} className="space-y-4">
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

          {mode === "signin" ? (
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
          ) : null}

          {mode === "reset" ? (
            <>
              <label className="space-y-2">
                <span className="text-sm font-medium">Reset Code</span>
                <Input
                  value={resetCode}
                  onChange={(event) => {
                    setResetCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                    if (errors.resetCode) setErrors((current) => ({ ...current, resetCode: undefined }))
                  }}
                  placeholder="6-digit code"
                  aria-invalid={Boolean(errors.resetCode)}
                />
                {errors.resetCode ? <p className="text-xs font-medium text-destructive">{errors.resetCode}</p> : null}
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">New Password</span>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(event) => {
                      setNewPassword(event.target.value)
                      if (errors.newPassword) setErrors((current) => ({ ...current, newPassword: undefined }))
                    }}
                    className="pl-9"
                    placeholder="Minimum 8 characters"
                    aria-invalid={Boolean(errors.newPassword)}
                  />
                </div>
                {errors.newPassword ? <p className="text-xs font-medium text-destructive">{errors.newPassword}</p> : null}
              </label>
            </>
          ) : null}

          <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="size-4" /> : null}
            {isSubmitting
              ? mode === "signin" ? "Signing in..." : mode === "forgot" ? "Sending..." : "Resetting..."
              : mode === "signin" ? "Sign in" : mode === "forgot" ? "Send reset code" : "Reset password"}
          </Button>
          <div className="flex items-center justify-between text-sm">
            {mode === "signin" ? (
              <button type="button" className="font-medium text-primary hover:underline" onClick={() => setMode("forgot")}>
                Forgot password?
              </button>
            ) : (
              <button type="button" className="font-medium text-primary hover:underline" onClick={() => setMode("signin")}>
                Back to sign in
              </button>
            )}
            {mode === "forgot" ? (
              <button type="button" className="font-medium text-primary hover:underline" onClick={() => setMode("reset")}>
                I have a code
              </button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
