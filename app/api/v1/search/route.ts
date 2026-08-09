import { NextRequest } from "next/server"

import { requireAuth } from "@/lib/auth"
import { withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    await requireAuth()
    const query = new URL(request.url).searchParams.get("query")?.trim() || ""
    if (query.length < 2) return { results: [] }

    const contains = { contains: query, mode: "insensitive" as const }
    const [members, trainers, products, plans] = await Promise.all([
      prisma.member.findMany({ where: { OR: [{ fullName: contains }, { email: contains }, { phoneNumber: contains }] }, orderBy: { fullName: "asc" }, take: 5, select: { id: true, fullName: true, email: true } }),
      prisma.trainer.findMany({ where: { OR: [{ fullName: contains }, { email: contains }, { phoneNumber: contains }, { specialty: contains }] }, orderBy: { fullName: "asc" }, take: 5, select: { id: true, fullName: true, specialty: true } }),
      prisma.storeProduct.findMany({ where: { OR: [{ name: contains }, { category: contains }, { description: contains }] }, orderBy: { name: "asc" }, take: 5, select: { id: true, name: true, category: true } }),
      prisma.membershipPlan.findMany({ where: { OR: [{ name: contains }, { description: contains }] }, orderBy: { name: "asc" }, take: 5, select: { id: true, name: true, description: true } }),
    ])

    return {
      results: [
        ...members.map((item) => ({ id: item.id, title: item.fullName, subtitle: item.email || "Member", type: "Member", href: `/members?search=${encodeURIComponent(item.fullName)}` })),
        ...trainers.map((item) => ({ id: item.id, title: item.fullName, subtitle: item.specialty, type: "Trainer", href: `/trainers?search=${encodeURIComponent(item.fullName)}` })),
        ...products.map((item) => ({ id: item.id, title: item.name, subtitle: item.category || "Store product", type: "Product", href: `/store/products?search=${encodeURIComponent(item.name)}` })),
        ...plans.map((item) => ({ id: item.id, title: item.name, subtitle: item.description || "Membership plan", type: "Plan", href: `/membership-plans?search=${encodeURIComponent(item.name)}` })),
      ],
    }
  }, { path: "/api/v1/search", method: "GET" })
}
