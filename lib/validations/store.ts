import { z } from "zod"

const optionalText = z.string().trim().optional().or(z.literal(""))

export const storeProductSchema = z.object({
  name: z.string().trim().min(2, "Product name is required"),
  category: optionalText,
  image: optionalText,
  description: optionalText,
  price: z.coerce.number().min(0.01, "Price must be at least 0.01"),
  availableQuantity: z.coerce.number().int().min(0, "Available quantity cannot be negative"),
  status: z.enum(["PUBLISHED", "UNPUBLISHED"]).default("UNPUBLISHED"),
})

export const storeProductUpdateSchema = storeProductSchema.partial()

export const storeOrderUpdateSchema = z.object({
  orderStatus: z.enum(["PROCESSING", "COMPLETED", "CANCELLED", "FAILED"]),
})

export const mobileStorePurchaseSchema = z.object({
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  phoneNumber: z.string().trim().min(7, "Payment phone number is required"),
  provider: z.enum(["EVC_PLUS", "JEEB", "ZAAD", "SAHAL"]).default("EVC_PLUS"),
  currency: z.string().trim().min(1).default("USD"),
})
