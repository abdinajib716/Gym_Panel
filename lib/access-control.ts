import bcrypt from "bcryptjs"

import { prisma } from "@/lib/prisma"

let accessControlSeedPromise: Promise<void> | null = null

const defaultPermissions = [
  { name: "settings.view", guardName: "web", groupKey: "settings" },
  { name: "settings.update", guardName: "web", groupKey: "settings" },
  { name: "users.view", guardName: "web", groupKey: "users" },
  { name: "users.create", guardName: "web", groupKey: "users" },
  { name: "users.update", guardName: "web", groupKey: "users" },
  { name: "users.delete", guardName: "web", groupKey: "users" },
  { name: "roles.view", guardName: "web", groupKey: "roles" },
  { name: "roles.create", guardName: "web", groupKey: "roles" },
  { name: "roles.update", guardName: "web", groupKey: "roles" },
  { name: "roles.delete", guardName: "web", groupKey: "roles" },
  { name: "permissions.view", guardName: "web", groupKey: "permissions" },
  { name: "permissions.create", guardName: "web", groupKey: "permissions" },
  { name: "permissions.update", guardName: "web", groupKey: "permissions" },
  { name: "permissions.delete", guardName: "web", groupKey: "permissions" },
  { name: "activity-logs.view", guardName: "web", groupKey: "activity_logs" },
  { name: "members.view", guardName: "web", groupKey: "members" },
  { name: "members.create", guardName: "web", groupKey: "members" },
  { name: "members.update", guardName: "web", groupKey: "members" },
  { name: "members.delete", guardName: "web", groupKey: "members" },
  { name: "plans.view", guardName: "web", groupKey: "plans" },
  { name: "plans.create", guardName: "web", groupKey: "plans" },
  { name: "plans.update", guardName: "web", groupKey: "plans" },
  { name: "plans.delete", guardName: "web", groupKey: "plans" },
  { name: "subscriptions.view", guardName: "web", groupKey: "subscriptions" },
  { name: "subscriptions.create", guardName: "web", groupKey: "subscriptions" },
  { name: "subscriptions.update", guardName: "web", groupKey: "subscriptions" },
  { name: "subscriptions.delete", guardName: "web", groupKey: "subscriptions" },
  { name: "payments.view", guardName: "web", groupKey: "payments" },
  { name: "payments.create", guardName: "web", groupKey: "payments" },
  { name: "payments.update", guardName: "web", groupKey: "payments" },
  { name: "payments.delete", guardName: "web", groupKey: "payments" },
  { name: "attendance.view", guardName: "web", groupKey: "attendance" },
  { name: "attendance.create", guardName: "web", groupKey: "attendance" },
  { name: "attendance.update", guardName: "web", groupKey: "attendance" },
  { name: "attendance.delete", guardName: "web", groupKey: "attendance" },
  { name: "notifications.view", guardName: "web", groupKey: "notifications" },
  { name: "notifications.create", guardName: "web", groupKey: "notifications" },
  { name: "notifications.delete", guardName: "web", groupKey: "notifications" },
  { name: "reports.view", guardName: "web", groupKey: "reports" },
  { name: "reports.export", guardName: "web", groupKey: "reports" },
  { name: "trainers.view", guardName: "web", groupKey: "trainers" },
  { name: "trainers.create", guardName: "web", groupKey: "trainers" },
  { name: "trainers.update", guardName: "web", groupKey: "trainers" },
  { name: "trainers.delete", guardName: "web", groupKey: "trainers" },
  { name: "waafi_config.view", guardName: "web", groupKey: "waafi_config" },
  { name: "waafi_config.update", guardName: "web", groupKey: "waafi_config" },
  { name: "waafi_config.test", guardName: "web", groupKey: "waafi_config" },
  { name: "payments.online_process", guardName: "web", groupKey: "payments" },
  { name: "payments.manual_create", guardName: "web", groupKey: "payments" },
  { name: "payments.status_check", guardName: "web", groupKey: "payments" },
]

const defaultRoles = [
  {
    name: "Super Admin",
    guardName: "web",
    permissionNames: defaultPermissions.map((permission) => permission.name),
  },
  {
    name: "Manager",
    guardName: "web",
    permissionNames: [
      "settings.view",
      "users.view",
      "users.create",
      "users.update",
      "roles.view",
      "permissions.view",
      "activity-logs.view",
      "members.view",
      "members.create",
      "members.update",
      "plans.view",
      "plans.create",
      "plans.update",
      "subscriptions.view",
      "subscriptions.create",
      "subscriptions.update",
      "payments.view",
      "payments.create",
      "payments.update",
      "attendance.view",
      "attendance.create",
      "attendance.update",
      "notifications.view",
      "notifications.create",
      "reports.view",
      "trainers.view",
      "trainers.create",
      "trainers.update",
      "waafi_config.view",
      "waafi_config.update",
      "waafi_config.test",
      "payments.online_process",
      "payments.manual_create",
      "payments.status_check",
    ],
  },
  {
    name: "Auditor",
    guardName: "web",
    permissionNames: [
      "activity-logs.view",
      "users.view",
      "roles.view",
      "permissions.view",
      "members.view",
      "plans.view",
      "subscriptions.view",
      "payments.view",
      "attendance.view",
      "notifications.view",
      "reports.view",
      "trainers.view",
      "waafi_config.view",
      "payments.status_check",
    ],
  },
]

const sampleUsers = [
  {
    firstName: "Abdinajib",
    lastName: "Mohamed",
    username: "abdinajib",
    email: "abdinajib@startap.dev",
    displayName: "Abdinajib Mohamed",
    roleNames: ["Super Admin"],
  },
  {
    firstName: "Hilowle",
    lastName: "Ali",
    username: "hilowle",
    email: "hilowle@startap.dev",
    displayName: "Hilowle Ali",
    roleNames: ["Manager"],
  },
  {
    firstName: "Karshan",
    lastName: "Poi",
    username: "karshan.poi",
    email: "karshan@startap.dev",
    displayName: "Karshan Poi",
    roleNames: ["Manager"],
  },
  {
    firstName: "Super",
    lastName: "Auditor",
    username: "super.auditor",
    email: "auditor@startap.dev",
    displayName: "Super Auditor",
    roleNames: ["Auditor"],
  },
]

function getSuperAdminSeed() {
  return {
    firstName: process.env.SUPERADMIN_FIRST_NAME || "Super",
    lastName: process.env.SUPERADMIN_LAST_NAME || "Admin",
    email: process.env.SUPERADMIN_EMAIL || "superadmin@startap.dev",
    password: process.env.SUPERADMIN_PASSWORD || "Startap123!",
  }
}

async function runAccessControlSeed() {
  const existingSettings = await prisma.accessControlSettings.findUnique({
    where: { key: "global" },
  })

  if (!existingSettings) {
    await prisma.accessControlSettings.create({
      data: {
        key: "global",
        siteName: "Startap Admin",
        themeMode: "system",
        primaryColor: "#2f8fe8",
        sidebarStyle: "default",
        layoutWidth: "boxed",
        headerStyle: "sticky",
        mailDriver: "smtp",
        fromName: "Startap Admin",
        fromEmail: "hello@startap.dev",
        smtpHost: "smtp.mailtrap.io",
        smtpPort: 587,
        smtpUsername: "mailer-user",
        smtpPassword: "mailer-password",
        encryption: "tls",
      },
    })
  }

  await prisma.accessPermission.createMany({
    data: defaultPermissions,
    skipDuplicates: true,
  })

  const permissions = await prisma.accessPermission.findMany()
  const permissionMap = new Map(permissions.map((permission) => [permission.name, permission.id]))

  for (const role of defaultRoles) {
    const upsertedRole = await prisma.accessRole.upsert({
      where: {
        name_guardName: {
          name: role.name,
          guardName: role.guardName,
        },
      },
      update: {},
      create: {
        name: role.name,
        guardName: role.guardName,
      },
    })

    await prisma.accessRolePermission.createMany({
      data: role.permissionNames
        .map((permissionName) => permissionMap.get(permissionName))
        .filter((value): value is string => Boolean(value))
        .map((permissionId) => ({
          roleId: upsertedRole.id,
          permissionId,
        })),
      skipDuplicates: true,
    })
  }

  const existingUsersCount = await prisma.accessUser.count()
  const superAdminSeed = getSuperAdminSeed()
  const superAdminRole = await prisma.accessRole.findUniqueOrThrow({
    where: {
      name_guardName: {
        name: "Super Admin",
        guardName: "web",
      },
    },
  })

  const existingSuperAdmin = await prisma.accessUser.findUnique({
    where: { email: superAdminSeed.email },
    include: {
      roles: true,
    },
  })

  const passwordHash = await bcrypt.hash(superAdminSeed.password, 10)

  if (!existingSuperAdmin) {
    await prisma.accessUser.create({
      data: {
        firstName: superAdminSeed.firstName,
        lastName: superAdminSeed.lastName,
        username: "superadmin",
        email: superAdminSeed.email,
        passwordHash,
        displayName: `${superAdminSeed.firstName} ${superAdminSeed.lastName}`.trim(),
        roles: {
          create: [{ roleId: superAdminRole.id }],
        },
      },
    })
  } else {
    await prisma.accessUser.update({
      where: { id: existingSuperAdmin.id },
      data: {
        firstName: superAdminSeed.firstName,
        lastName: superAdminSeed.lastName,
        passwordHash,
        displayName: `${superAdminSeed.firstName} ${superAdminSeed.lastName}`.trim(),
      },
    })

    const hasSuperAdminRole = existingSuperAdmin.roles.some((entry) => entry.roleId === superAdminRole.id)
    if (!hasSuperAdminRole) {
      await prisma.accessUserRole.create({
        data: {
          userId: existingSuperAdmin.id,
          roleId: superAdminRole.id,
        },
      })
    }
  }

  if (existingUsersCount <= 1) {
    const roles = await prisma.accessRole.findMany()
    const roleMap = new Map(roles.map((role) => [role.name, role.id]))

    for (const user of sampleUsers) {
      const existingUser = await prisma.accessUser.findUnique({
        where: { email: user.email },
      })

      if (existingUser) continue

      await prisma.accessUser.create({
        data: {
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          roles: {
            create: user.roleNames
              .map((roleName) => roleMap.get(roleName))
              .filter((value): value is string => Boolean(value))
              .map((roleId: string) => ({ roleId })),
          },
        },
      })
    }
  }

  const existingLogsCount = await prisma.accessActivityLog.count()

  if (existingLogsCount === 0) {
    const users = await prisma.accessUser.findMany({
      take: 5,
      orderBy: { createdAt: "asc" },
    })

    if (users.length > 0) {
      const [admin, manager, editor, auditor] = users

      await prisma.accessActivityLog.createMany({
        data: [
          {
            type: "settings",
            activity: "Updated branding configuration",
            subject: "System Settings",
            subjectId: "global",
            userId: admin?.id,
            userDisplay: admin?.displayName ?? "System Admin",
          },
          {
            type: "users",
            activity: "Created a new internal user profile",
            subject: manager?.displayName ?? "Manager",
            subjectId: manager?.id,
            userId: admin?.id,
            userDisplay: admin?.displayName ?? "System Admin",
          },
          {
            type: "roles",
            activity: "Reviewed role permissions",
            subject: "Manager",
            userId: editor?.id,
            userDisplay: editor?.displayName ?? "System Admin",
          },
          {
            type: "permissions",
            activity: "Audited permission matrix",
            subject: "Permission Registry",
            userId: auditor?.id,
            userDisplay: auditor?.displayName ?? "System Admin",
          },
        ],
      })
    }
  }
}

export async function ensureAccessControlSeed() {
  if (!accessControlSeedPromise) {
    accessControlSeedPromise = runAccessControlSeed().catch((error) => {
      accessControlSeedPromise = null
      throw error
    })
  }

  return accessControlSeedPromise
}

export async function createActivityLog(input: {
  type: string
  activity: string
  subject: string
  subjectId?: string
  userId?: string
  userDisplay?: string
  metadata?: unknown
}) {
  return prisma.accessActivityLog.create({
    data: {
      type: input.type,
      activity: input.activity,
      subject: input.subject,
      subjectId: input.subjectId,
      userId: input.userId,
      userDisplay: input.userDisplay,
      metadata: input.metadata as never,
    },
  })
}
