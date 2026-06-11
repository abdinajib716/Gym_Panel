import { z } from "zod"

const paginationNumber = (defaultValue: number) =>
  z.preprocess((value) => (value === null || value === "" ? undefined : value), z.coerce.number().int().positive().default(defaultValue))

export const gymPaginationQuerySchema = z.object({
  page: paginationNumber(1),
  limit: paginationNumber(10).pipe(z.number().max(100)),
  search: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  method: z.string().optional(),
  memberId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

const optionalText = z.string().trim().optional().or(z.literal(""))
const optionalEmail = z.string().trim().email("Invalid email format").optional().or(z.literal(""))
const optionalDate = z.string().optional().or(z.literal(""))

export const memberSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  phoneNumber: z.string().trim().min(1, "Phone number is required"),
  email: optionalEmail,
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  address: optionalText,
  dateOfBirth: optionalDate,
  emergencyContact: optionalText,
  profileImage: optionalText,
  status: z.enum(["ACTIVE", "PENDING", "SUSPENDED", "EXPIRED"]).default("PENDING"),
  trainerId: optionalText,
})

export const memberCreateSchema = memberSchema.extend({
  initialPlanId: optionalText,
  subscriptionStartDate: optionalDate,
  paymentAmount: z.coerce.number().nonnegative("Payment amount must be zero or more").optional().or(z.literal("")),
  paymentMethod: z.enum(["CASH", "EVC_MANUAL", "BANK_TRANSFER", "OTHER_MANUAL_MOBILE_MONEY"]).default("CASH"),
  paymentStatus: z.enum(["PAID", "PENDING", "FAILED", "CANCELLED"]).default("PENDING"),
  paymentDate: z.string().optional().or(z.literal("")),
  paymentReference: optionalText,
  paymentNotes: optionalText,
})

export const memberUpdateSchema = memberSchema.partial()

export const trainerSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  phoneNumber: z.string().trim().min(1, "Phone number is required"),
  email: optionalEmail,
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  specialty: z.string().trim().min(1, "Specialty is required"),
  availability: optionalText,
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
})

export const trainerUpdateSchema = trainerSchema.partial()

export const membershipPlanSchema = z.object({
  name: z.string().trim().min(1, "Plan name is required"),
  type: z.enum(["MONTHLY", "QUARTERLY", "ANNUAL", "GROUP_TRAINING", "PERSONAL_TRAINING"]),
  durationDays: z.coerce.number().int().positive("Duration is required"),
  price: z.coerce.number().nonnegative("Price is required"),
  description: optionalText,
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
})

export const membershipPlanUpdateSchema = membershipPlanSchema.partial()

export const subscriptionSchema = z.object({
  memberId: z.string().trim().min(1, "Member is required"),
  planId: z.string().trim().min(1, "Plan is required"),
  startDate: z.string().trim().min(1, "Start date is required"),
  expiryDate: z.string().trim().min(1, "Expiry date is required"),
  status: z.enum(["ACTIVE", "EXPIRED", "PENDING", "SUSPENDED"]).default("PENDING"),
  paymentStatus: z.enum(["PAID", "PENDING", "FAILED", "CANCELLED"]).default("PENDING"),
})

export const subscriptionUpdateSchema = subscriptionSchema.partial()

export const paymentSchema = z.object({
  memberId: z.string().trim().min(1, "Member is required"),
  subscriptionId: optionalText,
  planId: optionalText,
  amount: z.coerce.number().nonnegative("Amount is required"),
  currency: z.string().trim().default("USD"),
  method: z.enum(["CASH", "EVC_MANUAL", "BANK_TRANSFER", "OTHER_MANUAL_MOBILE_MONEY", "WAAFI", "EVC_ONLINE"]),
  status: z.enum(["PAID", "PENDING", "FAILED", "CANCELLED", "EXPIRED"]).default("PENDING"),
  paymentDate: z.string().trim().min(1, "Payment date is required"),
  reference: optionalText,
  notes: optionalText,
  transactionId: optionalText,
  provider: optionalText,
})

export const paymentUpdateSchema = paymentSchema.partial()

export const attendanceSchema = z.object({
  memberId: z.string().trim().min(1, "Member is required"),
  checkInDate: z.string().trim().min(1, "Check-in date is required"),
  method: z.enum(["MANUAL"]).default("MANUAL"),
  status: z.enum(["PRESENT", "CANCELLED"]).default("PRESENT"),
})

export const attendanceUpdateSchema = attendanceSchema.partial()

export const notificationSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  message: z.string().trim().min(1, "Message is required"),
  type: z.enum(["PAYMENT_REMINDER", "SUBSCRIPTION_EXPIRY", "GYM_ANNOUNCEMENT", "UPGRADE_CONFIRMATION", "GENERAL_MESSAGE"]),
  target: z.enum(["ALL_MEMBERS", "SINGLE_MEMBER"]).default("ALL_MEMBERS"),
  memberId: optionalText,
  readStatus: z.enum(["UNREAD", "READ"]).default("UNREAD"),
})

export const reportQuerySchema = gymPaginationQuerySchema.extend({
  report: z.enum(["members", "subscriptions", "payments", "attendance", "revenue"]).optional(),
})

export const waafiInitiatePaymentSchema = z.object({
  memberId: z.string().trim().min(1, "Member is required"),
  subscriptionId: z.string().trim().min(1, "Subscription is required"),
  planId: z.string().trim().min(1, "Plan is required"),
  amount: z.coerce.number().min(0.01, "Amount must be at least 0.01"),
  currency: z.string().trim().min(1, "Currency is required").default("USD"),
  provider: z.enum(["EVC_PLUS", "JEEB", "ZAAD", "SAHAL"]),
  phoneNumber: z.string().trim().min(1, "Phone number is required"),
})
