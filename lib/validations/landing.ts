import { z } from "zod"

const optionalText = z.string().trim().max(2000).optional().or(z.literal(""))
const optionalNullableText = z.string().trim().max(2000).nullable().optional().or(z.literal(""))
const optionalNullableEmail = z.string().trim().email().nullable().optional().or(z.literal(""))

export const landingPageUpdateSchema = z.object({
  published: z.boolean().optional(),
  heroEyebrow: z.string().trim().min(1).max(120).optional(),
  heroTitle: z.string().trim().min(1).max(180).optional(),
  heroDescription: z.string().trim().min(1).max(600).optional(),
  heroImage: z.string().trim().max(500).optional().or(z.literal("")),
  heroPrimaryLabel: z.string().trim().min(1).max(60).optional(),
  heroSecondaryLabel: z.string().trim().min(1).max(60).optional(),
  aboutTitle: z.string().trim().min(1).max(180).optional(),
  aboutDescription: z.string().trim().min(1).max(1200).optional(),
  contactEmail: optionalNullableEmail,
  contactPhone: optionalNullableText,
  contactAddress: z.string().trim().max(300).nullable().optional().or(z.literal("")),
})

export const landingTeamMemberSchema = z.object({
  name: z.string().trim().min(1).max(100),
  role: z.string().trim().min(1).max(120),
  bio: optionalText,
  image: z.string().trim().max(500).optional().or(z.literal("")),
  published: z.boolean().default(true),
})

export const landingTestimonialSchema = z.object({
  quote: z.string().trim().min(1).max(1000),
  name: z.string().trim().min(1).max(100),
  role: optionalText,
  image: z.string().trim().max(500).optional().or(z.literal("")),
  published: z.boolean().default(true),
})

export const landingSectionsSchema = z.object({
  sections: z.array(z.object({
    id: z.string().uuid(),
    position: z.number().int().nonnegative(),
    published: z.boolean(),
  })).min(1),
})

export const landingContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().max(60).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Please enter at least 10 characters").max(2000),
})

export const landingMessageStatusSchema = z.object({
  status: z.enum(["NEW", "READ", "ARCHIVED"]),
})
