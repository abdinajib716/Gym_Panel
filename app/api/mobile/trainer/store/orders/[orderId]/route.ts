import { NextRequest } from "next/server"

import { withErrorHandling } from "@/lib/error-handler"
import { getMobileStoreOrder } from "@/lib/mobile-store"

export async function GET(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  return withErrorHandling(async () => {
    const { orderId } = await params
    return { success: true, order: await getMobileStoreOrder(request, "TRAINER", orderId) }
  }, { path: "/api/mobile/trainer/store/orders/[orderId]", method: "GET" })
}
