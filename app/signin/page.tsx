import { redirect } from "next/navigation"

import { SignInForm } from "@/components/auth/signin-form"
import { Logo } from "@/components/ui/logo"
import { getAuthSession } from "@/lib/auth"

export default async function SignInPage() {
  const session = await getAuthSession()

  if (session?.user?.id) {
    redirect("/dashboard")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-5xl flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-lg space-y-4">
          <Logo href={null} />
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Protected control center</p>
          <h1 className="text-4xl font-bold leading-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Startap Superadmin
          </h1>
          <p className="text-base text-muted-foreground">
            Access the secured admin workspace with role-aware routing, permission checks, and Access Control management.
          </p>
        </div>
        <SignInForm />
      </div>
    </main>
  )
}
