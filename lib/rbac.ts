export type UserRole = "SUPER_ADMIN" | "ADMIN" | "AUDITOR"

export function mapAccessRolesToUserRole(roleNames: string[]): UserRole {
  if (roleNames.includes("Super Admin")) return "SUPER_ADMIN"
  if (roleNames.includes("Manager")) return "ADMIN"
  return "AUDITOR"
}

export function getRoleLabel(role: UserRole | string | null | undefined) {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin"
    case "ADMIN":
      return "Admin"
    case "AUDITOR":
      return "Auditor"
    default:
      return role || "User"
  }
}

export function hasPermission(permissions: string[] | undefined, permission: string) {
  return permissions?.includes(permission) ?? false
}
