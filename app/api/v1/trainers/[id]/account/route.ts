import { NextRequest } from "next/server"
import { requirePermission } from "@/lib/auth"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { prisma } from "@/lib/prisma"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    await requirePermission("trainers.update")
    const { id } = await params
    const { status } = await request.json() as { status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" }
    if (!status || !["ACTIVE", "INACTIVE", "SUSPENDED"].includes(status)) throw new AppError(400, "Valid account status is required")
    const account = await prisma.mobileAccount.update({ where: { trainerId: id }, data: { accountStatus: status } })
    return { accountStatus: account.accountStatus, message: `Trainer login is now ${status.toLowerCase()}` }
  }, { path: "/api/v1/trainers/[id]/account", method: "PUT" })
}
