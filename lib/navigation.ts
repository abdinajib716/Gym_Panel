import type { LucideIcon } from "lucide-react"
import {
  Activity,
  BarChart3,
  Bell,
  CalendarCheck,
  CreditCard,
  Dumbbell,
  KeyRound,
  NotepadText,
  Rocket,
  Settings2,
  ShieldCheck,
  ShieldEllipsis,
  UserCheck,
  Users,
} from "lucide-react"

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  description: string
  status: string
  suggestedWidgets: string[]
}

export type NavGroup = {
  title: string
  icon: LucideIcon
  children: NavItem[]
}

export const dashboardNav: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Rocket,
    description: "Gym performance overview and recent operational activity.",
    status: "Ready",
    suggestedWidgets: ["KPI cards", "Recent members", "Expiring subscriptions"],
  },
  {
    title: "Members",
    href: "/members",
    icon: Users,
    description: "Manage member profiles, status, subscriptions, payments, and attendance history.",
    status: "Live",
    suggestedWidgets: ["Member table", "Status filters", "Profile drawer"],
  },
  {
    title: "Membership Plans",
    href: "/membership-plans",
    icon: NotepadText,
    description: "Create and maintain gym membership plan pricing and duration.",
    status: "Live",
    suggestedWidgets: ["Plan table", "Pricing", "Activation status"],
  },
  {
    title: "Subscriptions",
    href: "/subscriptions",
    icon: CalendarCheck,
    description: "Assign, renew, upgrade, and suspend member subscriptions.",
    status: "Live",
    suggestedWidgets: ["Subscription table", "Renewal actions", "Payment status"],
  },
  {
    title: "Payments",
    href: "/payments",
    icon: CreditCard,
    description: "Record manual payments and track online payment readiness.",
    status: "Live",
    suggestedWidgets: ["Payment table", "Manual confirmation", "Revenue"],
  },
  {
    title: "Attendance",
    href: "/attendance",
    icon: Activity,
    description: "Track manual member check-ins and attendance history.",
    status: "Live",
    suggestedWidgets: ["Check-in", "Date filters", "Attendance report"],
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
    description: "Send announcements, payment reminders, and subscription messages.",
    status: "Live",
    suggestedWidgets: ["Composer", "Recipient filters", "Sent list"],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    description: "View member, subscription, payment, attendance, and revenue reports.",
    status: "Live",
    suggestedWidgets: ["Date filters", "Status filters", "Export placeholder"],
  },
]

export const gymManagementNav: NavItem[] = [
  {
    title: "Trainers",
    href: "/trainers",
    icon: UserCheck,
    description: "Manage trainer profiles, specialties, availability, and status.",
    status: "Live",
    suggestedWidgets: ["Trainer table", "Availability", "Member assignments"],
  },
]

export const accessControlNav: NavItem[] = [
  {
    title: "Settings",
    href: "/access-control/settings",
    icon: Settings2,
    description: "Global configuration, branding, and system email settings.",
    status: "Live",
    suggestedWidgets: ["General settings", "Site appearance", "Email configuration"],
  },
  {
    title: "Users",
    href: "/access-control/users",
    icon: Users,
    description: "Manage people, identities, and assigned access roles.",
    status: "Live",
    suggestedWidgets: ["User table", "Invite flow", "Role assignments"],
  },
  {
    title: "Roles",
    href: "/access-control/roles",
    icon: ShieldCheck,
    description: "Create role-based access groups for the admin platform.",
    status: "Live",
    suggestedWidgets: ["Role table", "Permission groups", "Access summaries"],
  },
  {
    title: "Permissions",
    href: "/access-control/permissions",
    icon: KeyRound,
    description: "Control the granular actions available across the platform.",
    status: "Live",
    suggestedWidgets: ["Permission list", "Guard names", "Quick filters"],
  },
  {
    title: "Activity Logs",
    href: "/access-control/activity-logs",
    icon: Activity,
    description: "Audit the latest governance and security-related actions.",
    status: "Live",
    suggestedWidgets: ["Audit trail", "Filters", "Search"],
  },
]

export const accessControlGroup: NavGroup = {
  title: "Access Control",
  icon: ShieldEllipsis,
  children: accessControlNav,
}

export const sidebarNav: Array<NavItem | NavGroup> = [
  {
    title: "Main",
    icon: Dumbbell,
    children: dashboardNav,
  },
  {
    title: "Gym Management",
    icon: UserCheck,
    children: gymManagementNav,
  },
  {
    title: "System",
    icon: ShieldEllipsis,
    children: accessControlNav,
  },
]

export function getNavItemByPath(pathname: string) {
  return [...dashboardNav, ...gymManagementNav, ...accessControlNav].find((item) => item.href === pathname)
}

export function getPlaceholderItem(item: string) {
  return [...dashboardNav, ...gymManagementNav].find((entry) => entry.href === `/${item}`)
}

export function getAccessControlItemByPath(pathname: string) {
  return accessControlNav.find((item) => item.href === pathname)
}

export function isAccessControlPath(pathname: string) {
  return pathname === "/access-control" || pathname.startsWith("/access-control/")
}

export function isGroupPath(group: NavGroup, pathname: string) {
  return group.children.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
}
