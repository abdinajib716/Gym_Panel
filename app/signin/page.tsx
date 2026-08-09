import { redirect } from "next/navigation"
import { Globe2 } from "lucide-react"

import { SignInForm } from "@/components/auth/signin-form"
import { SignInArtwork } from "@/components/auth/signin-artwork"
import { getAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function SignInPage() {
  const session = await getAuthSession()

  if (session?.user?.id) {
    redirect("/dashboard")
  }

  const branding = await prisma.accessControlSettings.findUnique({
    where: { key: "global" },
    select: { loginPageLogo: true },
  })

  return (
    <main className="min-h-screen bg-muted/45 text-foreground">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative grid min-h-screen bg-background">
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-6 py-5 sm:px-10">
            <a href="/" className="ml-auto flex size-10 items-center justify-center rounded-xl border border-border bg-card text-[var(--brand-navy)] shadow-sm transition-colors hover:bg-[var(--brand-navy-soft)]" aria-label="Back to website"><Globe2 className="size-4" /></a>
          </div>
          <div className="mx-auto grid w-full max-w-[31rem] place-content-center px-6 py-20">
            <div className="auth-panel rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <SignInForm />
            </div>
          </div>
        </section>
        <section className="relative hidden min-h-screen overflow-hidden bg-[var(--brand-navy)] lg:block" aria-hidden="true">
          <SignInArtwork src={branding?.loginPageLogo || "/images/illustrations/misc/welcome.svg"} />
        </section>
      </div>
    </main>
  )
}
