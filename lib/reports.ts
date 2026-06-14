import { dateRangeFilter, paginationMeta } from "@/lib/gym-api"
import { prisma } from "@/lib/prisma"

export type ReportName = "members" | "subscriptions" | "payments" | "attendance" | "revenue"

export type ReportFilters = {
  page: number
  limit: number
  search?: string
  status?: string
  memberId?: string
  dateFrom?: string
  dateTo?: string
}

export type ReportColumn = {
  key: string
  label: string
  format?: "date" | "currency" | "status"
}

export const reportLabels: Record<ReportName, string> = {
  members: "Member Report",
  subscriptions: "Subscription Report",
  payments: "Payment Report",
  attendance: "Attendance Report",
  revenue: "Revenue Report",
}

export function isReportName(value: string): value is ReportName {
  return value in reportLabels
}

export function reportColumns(report: ReportName): ReportColumn[] {
  if (report === "members") {
    return [
      { key: "fullName", label: "Member Name" },
      { key: "phoneNumber", label: "Phone Number" },
      { key: "email", label: "Email" },
      { key: "trainer.fullName", label: "Assigned Trainer" },
      { key: "status", label: "Status", format: "status" },
      { key: "createdAt", label: "Created Date", format: "date" },
    ]
  }

  if (report === "subscriptions") {
    return [
      { key: "member.fullName", label: "Member Name" },
      { key: "plan.name", label: "Plan Name" },
      { key: "plan.type", label: "Plan Type", format: "status" },
      { key: "startDate", label: "Start Date", format: "date" },
      { key: "expiryDate", label: "Expiry Date", format: "date" },
      { key: "status", label: "Subscription Status", format: "status" },
      { key: "paymentStatus", label: "Payment Status", format: "status" },
    ]
  }

  if (report === "payments" || report === "revenue") {
    return [
      { key: "member.fullName", label: "Member Name" },
      { key: "plan.name", label: "Plan Name" },
      { key: "amount", label: "Amount", format: "currency" },
      { key: "currency", label: "Currency" },
      { key: "method", label: "Payment Method", format: "status" },
      { key: "status", label: "Payment Status", format: "status" },
      { key: "paymentDate", label: "Payment Date", format: "date" },
      { key: "reference", label: "Reference" },
    ]
  }

  return [
    { key: "member.fullName", label: "Member Name" },
    { key: "checkInDate", label: "Check-in Date", format: "date" },
    { key: "method", label: "Method", format: "status" },
    { key: "status", label: "Attendance Status", format: "status" },
  ]
}

function nested(record: Record<string, unknown>, key: string) {
  return key.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") return undefined
    return (current as Record<string, unknown>)[part]
  }, record)
}

export function formatReportValue(value: unknown, column?: ReportColumn) {
  if (value === null || value === undefined || value === "") return "-"

  if (column?.format === "currency") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value))
  }

  if (column?.format === "date") {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(String(value)))
  }

  if (column?.format === "status") {
    return String(value).replaceAll("_", " ")
  }

  return String(value)
}

export function reportCell(record: Record<string, unknown>, column: ReportColumn) {
  return formatReportValue(nested(record, column.key), column)
}

function reportWhere(report: ReportName, filters: ReportFilters) {
  if (report === "members") {
    return {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.search ? { fullName: { contains: filters.search, mode: "insensitive" as const } } : {}),
    } as never
  }

  if (report === "subscriptions") {
    return {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.memberId ? { memberId: filters.memberId } : {}),
      ...(filters.dateFrom || filters.dateTo ? { createdAt: dateRangeFilter(filters.dateFrom, filters.dateTo) } : {}),
    } as never
  }

  if (report === "payments" || report === "revenue") {
    return {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.memberId ? { memberId: filters.memberId } : {}),
      ...(filters.dateFrom || filters.dateTo ? { paymentDate: dateRangeFilter(filters.dateFrom, filters.dateTo) } : {}),
    } as never
  }

  return {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.memberId ? { memberId: filters.memberId } : {}),
    ...(filters.dateFrom || filters.dateTo ? { checkInDate: dateRangeFilter(filters.dateFrom, filters.dateTo) } : {}),
  } as never
}

export async function getReportData(report: ReportName, filters: ReportFilters, all = false) {
  const where = reportWhere(report, filters)
  const skip = all ? undefined : (filters.page - 1) * filters.limit
  const take = all ? undefined : filters.limit

  if (report === "members") {
    const [rows, total] = await Promise.all([
      prisma.member.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, include: { trainer: true } }),
      prisma.member.count({ where }),
    ])
    return { rows, pagination: paginationMeta(total, filters.page, filters.limit) }
  }

  if (report === "subscriptions") {
    const [rows, total] = await Promise.all([
      prisma.subscription.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, include: { member: true, plan: true } }),
      prisma.subscription.count({ where }),
    ])
    return { rows, pagination: paginationMeta(total, filters.page, filters.limit) }
  }

  if (report === "payments" || report === "revenue") {
    const [rows, total, aggregate] = await Promise.all([
      prisma.payment.findMany({ where, orderBy: { paymentDate: "desc" }, skip, take, include: { member: true, plan: true } }),
      prisma.payment.count({ where }),
      prisma.payment.aggregate({ where: { ...(where as object), status: "PAID" } as never, _sum: { amount: true } }),
    ])
    return { rows, totalRevenue: aggregate._sum.amount ?? 0, pagination: paginationMeta(total, filters.page, filters.limit) }
  }

  const [rows, total] = await Promise.all([
    prisma.attendance.findMany({ where, orderBy: { checkInDate: "desc" }, skip, take, include: { member: true } }),
    prisma.attendance.count({ where }),
  ])
  return { rows, pagination: paginationMeta(total, filters.page, filters.limit) }
}

export function toCsv(columns: ReportColumn[], rows: Record<string, unknown>[]) {
  const escapeCsv = (value: string) => `"${value.replaceAll('"', '""')}"`
  return [
    columns.map((column) => escapeCsv(column.label)).join(","),
    ...rows.map((row) => columns.map((column) => escapeCsv(reportCell(row, column))).join(",")),
  ].join("\r\n")
}
