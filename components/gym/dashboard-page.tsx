"use client"

import { Activity, Bell, CalendarClock, CreditCard, Dumbbell, Users, UserCheck, WalletCards } from "lucide-react"

import { AccessCard, AccessPageHeader, Pill, TableEmpty, TableShell, TableSkeleton } from "@/components/access-control/shared"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useGymDashboard } from "@/lib/swr"
import { currency, shortDate, StatusPill } from "@/components/gym/crud-page"

type RecordValue = Record<string, unknown>

function nested(record: RecordValue, key: string) {
  return key.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") return undefined
    return (current as RecordValue)[part]
  }, record)
}

function MiniTable({
  title,
  rows,
  columns,
  loading,
}: {
  title: string
  rows: RecordValue[]
  columns: Array<{ key: string; label: string; render?: (record: RecordValue) => React.ReactNode }>
  loading?: boolean
}) {
  return (
    <AccessCard title={title}>
      <TableShell>
        <table className="min-w-full text-sm">
          <thead className="bg-muted/45 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3">{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row.id)} className="border-t border-border/70">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3">
                    {column.render ? column.render(row) : String(nested(row, column.key) ?? "-")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {loading ? <TableSkeleton columns={columns.length} rows={3} /> : null}
        {!loading && rows.length === 0 ? (
          <div className="p-4">
            <TableEmpty title="No records yet" description="Records will appear here after gym activity is added." />
          </div>
        ) : null}
      </TableShell>
    </AccessCard>
  )
}

export function GymDashboardPage() {
  const { data, isLoading } = useGymDashboard()
  const stats = (data?.stats ?? {}) as Record<string, unknown>

  const cards = [
    { label: "Total Members", value: stats.totalMembers ?? 0, icon: Users },
    { label: "Active Subscriptions", value: stats.activeSubscriptions ?? 0, icon: Dumbbell },
    { label: "Expired Subscriptions", value: stats.expiredSubscriptions ?? 0, icon: CalendarClock },
    { label: "Pending Payments", value: stats.pendingPayments ?? 0, icon: CreditCard },
    { label: "Today Attendance", value: stats.todayAttendance ?? 0, icon: Activity },
    { label: "Monthly Revenue", value: currency(stats.monthlyRevenue), icon: WalletCards },
    { label: "Total Trainers", value: stats.totalTrainers ?? 0, icon: UserCheck },
    { label: "Recent Notifications", value: stats.recentNotifications ?? 0, icon: Bell },
  ]

  return (
    <div className="space-y-5">
      <AccessPageHeader
        breadcrumb={["Dashboard"]}
        title="Gym Dashboard"
        description="A quick operational overview of members, subscriptions, payments, attendance, trainers, and notifications."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon

          return (
            <Card key={card.label} className="rounded-2xl border border-border/70">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                <Icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{String(card.value)}</div>
                <p className="text-xs text-muted-foreground">Live gym data</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <MiniTable
          title="Recent Members"
          rows={(data?.recentMembers as RecordValue[] | undefined) ?? []}
          loading={isLoading}
          columns={[
            { key: "fullName", label: "Member" },
            { key: "phoneNumber", label: "Phone" },
            { key: "status", label: "Status", render: (record) => <StatusPill value={String(record.status)} /> },
          ]}
        />
        <MiniTable
          title="Recent Payments"
          rows={(data?.recentPayments as RecordValue[] | undefined) ?? []}
          loading={isLoading}
          columns={[
            { key: "member.fullName", label: "Member" },
            { key: "amount", label: "Amount", render: (record) => currency(record.amount) },
            { key: "status", label: "Status", render: (record) => <StatusPill value={String(record.status)} /> },
          ]}
        />
        <MiniTable
          title="Expiring Subscriptions"
          rows={(data?.expiringSubscriptions as RecordValue[] | undefined) ?? []}
          loading={isLoading}
          columns={[
            { key: "member.fullName", label: "Member" },
            { key: "plan.name", label: "Plan" },
            { key: "expiryDate", label: "Expiry", render: (record) => shortDate(record.expiryDate) },
          ]}
        />
        <MiniTable
          title="Today Attendance"
          rows={(data?.todayAttendance as RecordValue[] | undefined) ?? []}
          loading={isLoading}
          columns={[
            { key: "member.fullName", label: "Member" },
            { key: "checkInDate", label: "Check-in", render: (record) => shortDate(record.checkInDate) },
            { key: "status", label: "Status", render: (record) => <Pill variant="secondary">{String(record.status).replaceAll("_", " ")}</Pill> },
          ]}
        />
      </div>
    </div>
  )
}
