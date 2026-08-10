"use client"

import { useEffect, useId, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, Dumbbell } from "lucide-react"

import { Logo } from "@/components/ui/logo"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { isGroupPath, sidebarNav, type NavGroup, type NavItem } from "@/lib/navigation"

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
      <SidebarMenuButton asChild isActive={isActivePath(item.href, pathname)} tooltip={item.title}>
        <Link href={item.href} onClick={() => setOpenMobile(false)} title={item.title} aria-label={item.title}>
          <Icon />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function SidebarSection({ group }: { group: NavGroup }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(() => isGroupPath(group, pathname))
  const contentId = useId()
  const GroupIcon = group.icon ?? Dumbbell
  const active = isGroupPath(group, pathname)

  // A nested route should never be hidden after navigation, including direct links.
  useEffect(() => {
    if (active) setOpen(true)
  }, [active])

  return (
    <SidebarGroup className="gap-1.5">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            type="button"
            isActive={active}
            tooltip={group.title}
            aria-expanded={open}
            aria-controls={contentId}
            onClick={() => setOpen((current) => !current)}
            className="min-h-9 py-1.5 text-xs font-medium"
          >
            <GroupIcon className="size-4" />
            <span>{group.title}</span>
            <ChevronDown
              className={`ml-auto size-3.5 transition-transform duration-200 group-data-[collapsible=icon]:hidden ${open ? "rotate-180" : ""}`}
            />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      <SidebarGroupContent
        id={contentId}
        className={!open ? "hidden group-data-[collapsible=icon]:block" : undefined}
      >
        <SidebarMenu className="gap-0.5">
          {group.children.map((item) => <SidebarLink key={item.href} item={item} />)}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AdminSidebar() {
  return (
    <Sidebar variant="sidebar" collapsible="icon" className="gym-sidebar">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="px-2 py-1">
          <Logo href="/dashboard" className="group-data-[collapsible=icon]:hidden" />
          <Logo href="/dashboard" variant="compact" className="hidden group-data-[collapsible=icon]:flex" />
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-5 pt-4">
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

          return <SidebarSection key={entry.title} group={entry} />
        })}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
