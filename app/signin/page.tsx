import { redirect } from "next/navigation"
import { Globe2 } from "lucide-react"

import { SignInForm } from "@/components/auth/signin-form"
import { SignInArtwork } from "@/components/auth/signin-artwork"
import { getAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Replace this one path later if you add a dedicated gym login image.
const DEFAULT_LOGIN_ARTWORK = "/images/misc/hero-dark.png"

export default async function SignInPage() {
  const session = await getAuthSession()

  if (session?.user?.id) {
    redirect("/dashboard")
  }

  const branding = await prisma.accessControlSettings.findUnique({
    where: { key: "global" },
    select: { loginPageLogo: true },
  })
  const loginArtwork = branding?.loginPageLogo || DEFAULT_LOGIN_ARTWORK

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="relative grid min-h-screen bg-background px-5 py-5 sm:px-8 sm:py-8 lg:px-12">
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-5 sm:px-8 sm:py-8 lg:px-12">
            <a href="/" className="ml-auto flex size-10 items-center justify-center rounded-xl border border-border bg-card text-[var(--brand-navy)] shadow-sm transition-colors hover:bg-[var(--brand-navy-soft)]" aria-label="Back to website"><Globe2 className="size-4" /></a>
          </div>
          <div className="mx-auto grid w-full max-w-[28rem] place-content-center py-20 sm:py-24 lg:mx-0 lg:ml-[10%]">
            <div className="auth-panel rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <SignInForm />
            </div>
          </div>
        </section>
        <section className="relative hidden min-h-screen flex-col overflow-hidden bg-[var(--brand-navy)] p-8 lg:flex xl:p-12" aria-hidden="true">
          <SignInArtwork src={loginArtwork} />
          <div className="relative z-10 mt-auto max-w-md">
            <p className="text-2xl font-bold tracking-tight text-white">Gym Management System</p>
            <p className="mt-3 text-sm leading-6 text-white/75">Manage members, memberships, payments, and attendance from one place.</p>
          </div>
        </section>
      </div>
    </main>
  )
}
