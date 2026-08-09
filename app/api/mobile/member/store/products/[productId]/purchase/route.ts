import { NextRequest } from "next/server"

import { withErrorHandling } from "@/lib/error-handler"
import { purchaseMobileStoreProduct } from "@/lib/mobile-store"

export async function POST(request: NextRequest, { params }: { params: Promise<{ productId: string }> }) {
  return withErrorHandling(async () => {
    const { productId } = await params
    return purchaseMobileStoreProduct(request, "MEMBER", productId)
  }, { path: "/api/mobile/member/store/products/[productId]/purchase", method: "POST" })
}
