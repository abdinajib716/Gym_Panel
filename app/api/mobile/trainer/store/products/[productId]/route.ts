import { NextRequest } from "next/server"

import { withErrorHandling } from "@/lib/error-handler"
import { getMobileStoreProduct, requireStoreBuyer } from "@/lib/mobile-store"

export async function GET(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  return withErrorHandling(async () => {
    await requireStoreBuyer(request, "TRAINER")
    const { productId } = await params
    return { success: true, product: await getMobileStoreProduct(productId) }
  }, { path: "/api/mobile/trainer/store/products/[productId]", method: "GET" })
}
