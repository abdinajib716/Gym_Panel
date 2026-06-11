import { Sparkles, Waypoints } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"

type AppLogoProps = {
  compact?: boolean
  className?: string
}

export function AppLogo({ compact = false, className }: AppLogoProps) {
  return (
    <Link href="/dashboard" className={cn("flex items-center gap-3", className)}>
      <div className="relative flex size-11 items-center justify-center rounded-2xl bg-linear-to-br from-primary via-primary/90 to-secondary text-primary-foreground shadow-[0_20px_50px_-24px_var(--color-primary)]">
        <Waypoints className="size-5" />
        <Sparkles className="absolute -top-1 -right-1 size-3" />
      </div>
      {compact ? null : (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-sidebar-foreground" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Startap Admin
          </p>
          <p className="truncate text-xs text-sidebar-foreground/65">Reusable SaaS dashboard starter</p>
        </div>
      )}
    </Link>
  )
}
