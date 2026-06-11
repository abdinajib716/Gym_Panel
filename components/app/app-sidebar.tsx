"use client"

import { LayoutTemplate, Zap } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { AppLogo } from "@/components/app/app-logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { dashboardNav } from "@/lib/navigation"

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <AppLogo />
        <div className="overflow-hidden rounded-[1.5rem] border border-white/8 bg-linear-to-br from-sidebar-primary/16 to-transparent p-4 text-sidebar-foreground group-data-[collapsible=icon]:hidden">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/70">
            <Zap className="size-3.5" />
            Starter System
          </div>
          <p className="text-sm font-medium">Frontend-only dashboard shell ready for any application.</p>
          <p className="mt-2 text-xs leading-5 text-sidebar-foreground/65">
            Replace the placeholder routes with your real modules when you are ready to integrate auth, APIs, and business logic.
          </p>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dashboardNav.map((item, index) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={item.href}>
                        <Icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {index > 0 ? <SidebarMenuBadge>{index}</SidebarMenuBadge> : null}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="rounded-[1.5rem] border border-white/8 bg-white/4 p-4 text-sidebar-foreground group-data-[collapsible=icon]:hidden">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/70">
            <LayoutTemplate className="size-3.5" />
            Design Notes
          </div>
          <p className="text-sm font-medium">Minimal backend assumptions.</p>
          <p className="mt-1 text-xs leading-5 text-sidebar-foreground/65">
            This project stays focused on the frontend layout, navigation, and starter experience.
          </p>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
