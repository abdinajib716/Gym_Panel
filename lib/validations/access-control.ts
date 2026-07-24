import { z } from "zod"

const emailSchema = z.string().email("Invalid email format")
const imageUrlSchema = z.string().trim().optional()
const optionalTextSchema = z.string().trim().optional().or(z.literal(""))

function validatePasswordMatch(
  value: {
    password?: string
    confirmPassword?: string
  },
  ctx: z.RefinementCtx,
) {
  const hasPassword = Boolean(value.password)
  const hasConfirm = Boolean(value.confirmPassword)

  if (hasPassword || hasConfirm) {
    if ((value.password ?? "") !== (value.confirmPassword ?? "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      })
    }
  }
}

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
})

export const settingsSchema = z.object({
  siteName: z.string().trim().min(1, "Site name is required"),
  siteLogoFullLight: imageUrlSchema,
  siteIcon: imageUrlSchema,
  siteLogoFullDark: imageUrlSchema,
  siteFavicon: imageUrlSchema,
  loginPageLogo: imageUrlSchema,
  themeMode: z.enum(["light", "dark", "system"]),
  primaryColor: z.string().trim().min(1, "Primary color is required"),
  sidebarStyle: z.enum(["default", "compact", "floating"]),
  layoutWidth: z.enum(["boxed", "full"]),
  headerStyle: z.enum(["sticky", "static", "minimal"]),
  mailDriver: z.enum(["smtp", "sendmail", "resend"]),
  fromName: z.string().trim().min(1, "From name is required"),
  fromEmail: emailSchema,
  smtpHost: z.string().trim().min(1, "SMTP host is required"),
  smtpPort: z.coerce.number().int().positive("SMTP port is required"),
  smtpUsername: z.string().trim().min(1, "SMTP username is required"),
  smtpPassword: z.string().trim().min(1, "SMTP password is required"),
  encryption: z.enum(["none", "ssl", "tls"]),
  firebaseEnabled: z.boolean().default(false),
  firebaseProjectId: optionalTextSchema,
  firebaseClientEmail: optionalTextSchema,
  firebasePrivateKey: optionalTextSchema,
  firebaseServerKey: optionalTextSchema,
})

export const settingsUpdateSchema = settingsSchema.partial()

export const waafiConfigSchema = z.object({
  waafiEnabled: z.boolean().default(false),
  waafiEnvironment: z.enum(["test", "live"]).default("test"),
  waafiApiBaseUrl: z.string().trim().url("API Base URL must be a valid URL").optional().or(z.literal("")),
  waafiMerchantUid: optionalTextSchema,
  waafiApiUserId: optionalTextSchema,
  waafiApiKey: optionalTextSchema,
  waafiMerchantNumber: optionalTextSchema,
})

export const waafiTestSchema = z.object({
  phoneLocal: z.string().trim().regex(/^[1-9]\d{8}$/, "Enter 9 digits without the 252 prefix"),
  amount: z.coerce.number().min(0.01, "Amount must be at least 0.01").default(0.01),
  provider: z.enum(["EVC_PLUS", "JEEB", "ZAAD", "SAHAL"]).default("EVC_PLUS"),
})

const userBaseFields = {
  avatarUrl: imageUrlSchema,
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  username: z.string().trim().min(1, "Username is required"),
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
  confirmPassword: z.string().optional().or(z.literal("")),
  displayName: z.string().trim().optional(),
  roleIds: z.array(z.string().min(1)).min(1, "Select one role").max(1, "Select only one role"),
}

export const userBaseSchema = z.object(userBaseFields)

export const createUserSchema = userBaseSchema.superRefine(validatePasswordMatch)
export const updateUserSchema = z.object({
  ...userBaseFields,
  firstName: z.string().trim().min(1, "First name is required").optional(),
  lastName: z.string().trim().min(1, "Last name is required").optional(),
  username: z.string().trim().min(1, "Username is required").optional(),
  email: emailSchema.optional(),
  roleIds: z.array(z.string().min(1)).max(1, "Select only one role").optional(),
}).partial().superRefine(validatePasswordMatch)

export const roleSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  guardName: z.string().trim().min(1, "Guard name is required").default("web"),
  permissionIds: z.array(z.string().min(1)).default([]),
})

export const permissionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  guardName: z.string().trim().min(1, "Guard name is required").default("web"),
  groupKey: z.string().trim().min(1, "Permission group is required"),
})

export const activityLogQuerySchema = paginationQuerySchema.extend({
  type: z.string().optional(),
  sort: z.enum(["date-desc", "date-asc"]).default("date-desc"),
})
