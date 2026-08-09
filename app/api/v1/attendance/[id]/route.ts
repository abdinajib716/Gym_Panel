import { NextRequest } from "next/server"

import { createActivityLog } from "@/lib/access-control"
import { requirePermission } from "@/lib/auth"
import { AppError, withErrorHandling } from "@/lib/error-handler"
import { requiredDate } from "@/lib/gym-api"
import { prisma } from "@/lib/prisma"
import { attendanceUpdateSchema } from "@/lib/validations/gym"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    await requirePermission("attendance.view")
    const { id } = await params

    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: { member: true },
    })

    if (!attendance) {
      throw new AppError(404, "Attendance record not found")
    }

    return { attendance }
  }, { path: "/api/v1/attendance/[id]", method: "GET" })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await requirePermission("attendance.update")
    const { id } = await params
    const payload = attendanceUpdateSchema.parse(await request.json())

    const existingAttendance = await prisma.attendance.findUnique({ where: { id } })
    if (!existingAttendance) {
      throw new AppError(404, "Attendance record not found")
    }

    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        ...(payload.memberId !== undefined ? { memberId: payload.memberId } : {}),
        ...(payload.checkInDate !== undefined ? { checkInDate: requiredDate(payload.checkInDate) } : {}),
        ...(payload.method !== undefined ? { method: payload.method } : {}),
        ...(payload.status !== undefined ? { status: payload.status } : {}),
      },
      include: { member: true },
    })

    await createActivityLog({
      type: "attendance",
      activity: "Updated attendance check-in",
      subject: attendance.member.fullName,
      subjectId: attendance.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
    })

    return { attendance, message: "Attendance updated successfully" }
  }, { path: "/api/v1/attendance/[id]", method: "PUT" })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withErrorHandling(async () => {
    const session = await requirePermission("attendance.delete")
    const { id } = await params

    const existingAttendance = await prisma.attendance.findUnique({
      where: { id },
      include: { member: true },
    })
    if (!existingAttendance) {
      throw new AppError(404, "Attendance record not found")
    }

    await prisma.attendance.delete({ where: { id } })

    await createActivityLog({
      type: "attendance",
      activity: "Deleted attendance check-in",
      subject: existingAttendance.member.fullName,
      subjectId: existingAttendance.id,
      userId: session.user.id,
      userDisplay: session.user.name || session.user.email || "System Admin",
    })

    return { success: true, message: "Attendance deleted successfully" }
  }, { path: "/api/v1/attendance/[id]", method: "DELETE" })
}
