"use client"

import { BellDot, Search, Sparkles } from "lucide-react"
import { usePathname } from "next/navigation"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { getNavItemByPath } from "@/lib/navigation"

export function AppHeader() {
  const pathname = usePathname()
  const activeItem = getNavItemByPath(pathname)

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger className="md:hidden" />
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="size-3.5" />
              Startap Admin Starter
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:gap-3">
              <h1 className="truncate text-2xl font-semibold text-foreground" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                {activeItem?.title ?? "Dashboard"}
              </h1>
              <p className="truncate text-sm text-muted-foreground">{activeItem?.description ?? "Frontend starter workspace"}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden w-72 lg:block">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input className="pl-9" placeholder="Search modules, tasks, ideas" />
          </div>

          <button className="hidden size-10 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground transition hover:text-foreground sm:flex">
            <BellDot className="size-4" />
            <span className="sr-only">Notifications</span>
          </button>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60">
                <Avatar className="size-10 border border-border/70 bg-primary/10">
                  <AvatarFallback className="bg-primary/10 font-semibold text-primary">SA</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">Startap Admin</span>
                  <span className="text-muted-foreground text-xs">Frontend starter panel</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile Settings</DropdownMenuItem>
              <DropdownMenuItem>Theme Preferences</DropdownMenuItem>
              <DropdownMenuItem>Workspace Branding</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
