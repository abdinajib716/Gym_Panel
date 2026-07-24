import { NextRequest } from "next/server"

import { AppError } from "@/lib/error-handler"
import { requireMobileAccount } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"

type MobileAccount = Awaited<ReturnType<typeof requireMobileAccount>>

export async function requireMobileTrainer(request: NextRequest) {
  const account = await requireMobileAccount(request)
  if (account.role !== "TRAINER" || !account.trainerId || !account.trainer) {
    throw new AppError(403, "Trainer access required")
  }
  if (account.trainer.status !== "ACTIVE") throw new AppError(403, "Trainer is inactive")
  return account as MobileAccount & { trainerId: string; trainer: NonNullable<MobileAccount["trainer"]> }
}

export async function trainerOwnsMember(trainerId: string, memberId: string) {
  const member = await prisma.member.findFirst({ where: { id: memberId, trainerId } })
  if (!member) throw new AppError(404, "Assigned member not found")
  return member
}

export async function trainerOwnsGroup(trainerId: string, groupId: string) {
  const group = await prisma.trainerGroup.findFirst({ where: { id: groupId, trainerId } })
  if (!group) throw new AppError(404, "Assigned group not found")
  return group
}

export async function trainerOwnsWorkout(trainerId: string, workoutId: string) {
  const workout = await prisma.workout.findFirst({ where: { id: workoutId, trainerId } })
  if (!workout) throw new AppError(404, "Workout not found")
  return workout
}

export async function trainerOwnsSchedule(trainerId: string, scheduleId: string) {
  const schedule = await prisma.trainerSchedule.findFirst({ where: { id: scheduleId, trainerId } })
  if (!schedule) throw new AppError(404, "Schedule not found")
  return schedule
}

export async function validateTrainerTarget(trainerId: string, memberId?: string | null, groupId?: string | null) {
  if (Boolean(memberId) === Boolean(groupId)) {
    throw new AppError(400, "Choose exactly one assigned member or group")
  }
  if (memberId) await trainerOwnsMember(trainerId, memberId)
  if (groupId) await trainerOwnsGroup(trainerId, groupId)
}

export const workoutInclude = {
  member: { select: { id: true, fullName: true, phoneNumber: true, profileImage: true } },
  group: { select: { id: true, name: true } },
  trainer: { select: { id: true, fullName: true, profileImage: true, specialty: true } },
  schedules: { orderBy: { date: "asc" as const } },
}

export const scheduleInclude = {
  member: { select: { id: true, fullName: true, phoneNumber: true, profileImage: true } },
  group: { select: { id: true, name: true } },
  workout: { select: { id: true, title: true, image: true, description: true, sets: true, reps: true, durationMinutes: true } },
  trainer: { select: { id: true, fullName: true, profileImage: true } },
}

export function dayBounds(value = new Date()) {
  const start = new Date(value)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

export async function notifyMember(memberId: string, title: string, message: string, type: "WORKOUT_ASSIGNED" | "SCHEDULE_ASSIGNED") {
  return prisma.notification.create({
    data: { memberId, title, message, type, target: "SINGLE_MEMBER" },
  })
}

export async function targetMemberIds(memberId?: string | null, groupId?: string | null) {
  if (memberId) return [memberId]
  if (!groupId) return []
  const memberships = await prisma.trainerGroupMember.findMany({ where: { groupId }, select: { memberId: true } })
  return memberships.map((entry) => entry.memberId)
}
