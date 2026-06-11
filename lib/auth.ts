import bcrypt from "bcryptjs"
import { getServerSession, type NextAuthOptions } from "next-auth"
import type { JWT } from "next-auth/jwt"
import CredentialsProvider from "next-auth/providers/credentials"

import { ensureAccessControlSeed } from "@/lib/access-control"
import { AppError } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"
import { hasPermission, mapAccessRolesToUserRole } from "@/lib/rbac"

async function loadAccessUserByEmail(email: string) {
  await ensureAccessControlSeed()

  return prisma.accessUser.findUnique({
    where: { email },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  })
}

function buildAuthPayload(user: NonNullable<Awaited<ReturnType<typeof loadAccessUserByEmail>>>) {
  const roleNames = user.roles.map((entry) => entry.role.name)
  const permissions = Array.from(
    new Set(user.roles.flatMap((entry) => entry.role.permissions.map((permissionEntry) => permissionEntry.permission.name))),
  )
  const primaryRole = mapAccessRolesToUserRole(roleNames)

  return {
    id: user.id,
    email: user.email,
    name: user.displayName || `${user.firstName} ${user.lastName}`.trim(),
    image: user.avatarUrl || "",
    role: primaryRole,
    roles: roleNames,
    permissions,
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Enter your email and password")
        }

        const user = await loadAccessUserByEmail(credentials.email)

        if (!user?.passwordHash) {
          throw new Error("Invalid email or password")
        }

        const isCorrectPassword = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!isCorrectPassword) {
          throw new Error("Invalid email or password")
        }

        return buildAuthPayload(user)
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = (user as { image?: string }).image
        token.role = (user as { role?: string }).role
        token.roles = (user as { roles?: string[] }).roles || []
        token.permissions = (user as { permissions?: string[] }).permissions || []
      }

      if (token.email) {
        const dbUser = await loadAccessUserByEmail(token.email)
        if (dbUser) {
          const authPayload = buildAuthPayload(dbUser)
          token.id = authPayload.id
          token.email = authPayload.email
          token.name = authPayload.name
          token.picture = authPayload.image
          token.role = authPayload.role
          token.roles = authPayload.roles
          token.permissions = authPayload.permissions
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.name = token.name
        session.user.email = token.email
        session.user.image = (token.picture as string | null | undefined) || null
        session.user.role = (token.role as string | undefined) || null
        session.user.roles = (token.roles as string[] | undefined) || []
        session.user.permissions = (token.permissions as string[] | undefined) || []
      }
      return session
    },
  },
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export const getAuthSession = () => getServerSession(authOptions)

export async function requireAuth() {
  await ensureAccessControlSeed()
  const session = await getAuthSession()

  if (!session?.user?.id) {
    throw new AppError(401, "Authentication required")
  }

  return session
}

export async function requirePermission(permission: string) {
  const session = await requireAuth()

  if (!hasPermission(session.user.permissions, permission)) {
    throw new AppError(403, "You do not have permission to perform this action")
  }

  return session
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string | null
      roles?: string[]
      permissions?: string[]
    }
  }

  interface User {
    id: string
    role?: string | null
    roles?: string[]
    permissions?: string[]
    image?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: string | null
    roles?: string[]
    permissions?: string[]
  }
}
