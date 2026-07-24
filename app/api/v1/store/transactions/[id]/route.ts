import { NextRequest } from "next/server"

import { requirePermission } from "@/lib/auth"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"
import { safeStoreTransaction } from "@/lib/store"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    await requirePermission("store_transactions.view")
    const { id } = await params

    const transaction = await prisma.storeTransaction.findUnique({
      where: { id },
      include: { product: true, order: true, member: true, trainer: true },
    })

    if (!transaction) throw new AppError(404, "Transaction not found")

    return { transaction: safeStoreTransaction(transaction) }
  }, { path: "/api/v1/store/transactions/[id]", method: "GET" })
}
