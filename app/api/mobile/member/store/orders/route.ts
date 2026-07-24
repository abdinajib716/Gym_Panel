import { NextRequest } from "next/server"

import { withErrorHandling } from "@/lib/error-handler"
import { listMobileStoreOrders } from "@/lib/mobile-store"

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    return { success: true, orders: await listMobileStoreOrders(request, "MEMBER") }
  }, { path: "/api/mobile/member/store/orders", method: "GET" })
}
