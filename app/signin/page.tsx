import { redirect } from "next/navigation"
import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react"

import { SignInForm } from "@/components/auth/signin-form"
import { Logo } from "@/components/ui/logo"
import { getAuthSession } from "@/lib/auth"

export default async function SignInPage() {
  const session = await getAuthSession()

  if (session?.user?.id) {
    redirect("/dashboard")
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-20 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-8 rounded-[2rem] border border-border/50 bg-card/50 p-6 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.5)] backdrop-blur sm:p-8 lg:p-10">
          <Logo href={null} preferLoginLogo />
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Protected control center
            </p>
            <h1 className="max-w-xl text-4xl font-bold leading-tight sm:text-5xl" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              Welcome back to GymMaster admin.
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Sign in to manage members, trainers, payments, attendance, mobile APIs, and access control from one secure dashboard.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {["Role-aware access", "Secure reset flow", "Live dashboard"].map((item) => (
              <div key={item} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <CheckCircle2 className="mb-3 h-5 w-5 text-primary" />
                <p className="text-sm font-medium">{item}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-primary/25 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            <span>Use your superadmin credentials. Password reset codes are sent through the configured SMTP email account.</span>
          </div>
        </div>

        <SignInForm />
      </div>
    </main>
  )
}
