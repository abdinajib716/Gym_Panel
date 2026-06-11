import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const protectedPrefixes = [
  "/dashboard",
  "/members",
  "/membership-plans",
  "/subscriptions",
  "/payments",
  "/attendance",
  "/notifications",
  "/reports",
  "/trainers",
  "/access-control",
]

const permissionMatchers: Array<{ prefix: string; permission: string }> = [
  { prefix: "/members", permission: "members.view" },
  { prefix: "/membership-plans", permission: "plans.view" },
  { prefix: "/subscriptions", permission: "subscriptions.view" },
  { prefix: "/payments", permission: "payments.view" },
  { prefix: "/attendance", permission: "attendance.view" },
  { prefix: "/notifications", permission: "notifications.view" },
  { prefix: "/reports", permission: "reports.view" },
  { prefix: "/trainers", permission: "trainers.view" },
  { prefix: "/access-control/settings", permission: "settings.view" },
  { prefix: "/access-control/users", permission: "users.view" },
  { prefix: "/access-control/roles", permission: "roles.view" },
  { prefix: "/access-control/permissions", permission: "permissions.view" },
  { prefix: "/access-control/activity-logs", permission: "activity-logs.view" },
]

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  const shouldProtect = protectedPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))

  if (!shouldProtect) {
    return NextResponse.next()
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    return NextResponse.redirect(new URL("/signin", request.url))
  }

  const matchingPermission = permissionMatchers.find((entry) => path === entry.prefix || path.startsWith(`${entry.prefix}/`))
  if (matchingPermission) {
    const permissions = (token.permissions as string[] | undefined) || []
    if (!permissions.includes(matchingPermission.permission)) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/members/:path*",
    "/membership-plans/:path*",
    "/subscriptions/:path*",
    "/payments/:path*",
    "/attendance/:path*",
    "/notifications/:path*",
    "/reports/:path*",
    "/trainers/:path*",
    "/access-control/:path*",
  ],
}
