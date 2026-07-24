"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Dumbbell } from "lucide-react"

import { Logo } from "@/components/ui/logo"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { sidebarNav, type NavGroup, type NavItem } from "@/lib/navigation"

function isNavGroup(item: NavItem | NavGroup): item is NavGroup {
  return "children" in item
}

function isActivePath(href: string, pathname: string) {
  if (href === "/dashboard") return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

function SidebarLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const Icon = item.icon

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActivePath(item.href, pathname)}>
        <Link href={item.href} onClick={() => setOpenMobile(false)} title={item.title} aria-label={item.title}>
          <Icon />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AdminSidebar() {
  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <div className="rounded-2xl border border-sidebar-border/60 bg-sidebar px-2 py-2">
          <Logo href="/dashboard" className="group-data-[collapsible=icon]:hidden" />
          <Logo href="/dashboard" variant="compact" className="hidden group-data-[collapsible=icon]:flex" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {sidebarNav.map((entry) => {
          if (!isNavGroup(entry)) {
            return (
              <SidebarGroup key={entry.href}>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarLink item={entry} />
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )
          }

          const GroupIcon = entry.icon ?? Dumbbell

          return (
            <SidebarGroup key={entry.title}>
              <SidebarGroupLabel className="flex items-center gap-2">
                <GroupIcon className="h-3.5 w-3.5" />
                <span>{entry.title}</span>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {entry.children.map((item) => (
                    <SidebarLink key={item.href} item={item} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
