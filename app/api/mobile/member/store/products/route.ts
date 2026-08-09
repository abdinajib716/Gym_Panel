import { NextRequest } from "next/server"

import { withErrorHandling } from "@/lib/error-handler"
import { listMobileStoreProducts, requireStoreBuyer } from "@/lib/mobile-store"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    await requireStoreBuyer(request, "MEMBER")
    return { success: true, products: await listMobileStoreProducts() }
  }, { path: "/api/mobile/member/store/products", method: "GET" })
}
