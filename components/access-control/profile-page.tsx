"use client"

import Link from "next/link"
import { Settings, Users } from "lucide-react"
import { useSession } from "next-auth/react"

import { AccessCard, AccessPageHeader, Pill } from "@/components/access-control/shared"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getRoleLabel } from "@/lib/rbac"

function initials(value: string) {
  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function AccessProfilePage() {
  const { data: session } = useSession()
  const userName = session?.user?.name || "Super Admin"
  const userEmail = session?.user?.email || "admin@example.com"
  const userRole = session?.user?.role || "SUPER_ADMIN"

  return (
    <div className="space-y-5">
      <AccessPageHeader
        breadcrumb={["Dashboard", "Profile"]}
        title="Profile"
        description="Review the currently signed-in admin account."
      />

      <AccessCard title="Admin Account" description="Profile details come from the authenticated access-control user.">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Avatar className="h-24 w-24 ring-2 ring-primary/20">
            <AvatarImage src={session?.user?.image ?? undefined} alt={userName} />
            <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">
              {initials(userName)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <h2 className="truncate text-2xl font-semibold tracking-tight">{userName}</h2>
              <p className="truncate text-sm text-muted-foreground">{userEmail}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill variant="secondary" className="bg-primary/10 text-primary">{getRoleLabel(userRole)}</Pill>
              {session?.user?.roles?.map((role) => (
                <Pill key={role} variant="outline">{role}</Pill>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild className="gap-2">
                <Link href="/access-control/settings">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link href="/access-control/users">
                  <Users className="h-4 w-4" />
                  Manage users
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </AccessCard>
    </div>
  )
}
