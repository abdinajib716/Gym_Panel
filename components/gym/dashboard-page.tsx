"use client"

import { Activity, ArrowRight, Bell, CalendarClock, CreditCard, Dumbbell, Users, UserCheck, WalletCards } from "lucide-react"
import Link from "next/link"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { AccessCard, Pill, TableEmpty, TableShell, TableSkeleton } from "@/components/access-control/shared"
import { Button } from "@/components/ui/button"
import { useGymDashboard } from "@/lib/swr"
import { currency, shortDate, StatusPill } from "@/components/gym/crud-page"

type RecordValue = Record<string, unknown>

function nested(record: RecordValue, key: string) {
  return key.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") return undefined
    return (current as RecordValue)[part]
  }, record)
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  emphasis,
}: {
  label: string
  value: React.ReactNode
  icon: React.ComponentType<{ className?: string }>
  tone?: "primary" | "sky" | "amber" | "rose"
  emphasis?: "navy" | "lime"
}) {
  const toneClasses = {
    primary: "bg-primary/20 text-[var(--brand-navy)]",
    sky: "bg-[var(--brand-navy-soft)] text-[var(--brand-navy)]",
    amber: "bg-accent text-[var(--brand-navy)]",
    rose: "bg-destructive/10 text-destructive",
  }

  return (
    <div className={`gym-metric-card rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md ${emphasis === "navy" ? "gym-metric-navy bg-[var(--brand-navy)] text-white border-transparent" : emphasis === "lime" ? "gym-metric-lime bg-primary text-primary-foreground border-transparent" : "bg-card"}`}>
      <div className="flex items-center justify-between gap-3">
        <p className={`text-[11px] font-bold uppercase tracking-[0.1em] ${emphasis ? "text-current/75" : "text-muted-foreground"}`}>{label}</p>
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${emphasis ? "bg-white/18 text-current" : toneClasses[tone]}`}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="mt-5">
        <p className={`text-[1.7rem] font-bold leading-none tracking-tight ${emphasis ? "text-current" : "text-foreground"}`}>{value}</p>
      </div>
    </div>
  )
}

function MiniTable({
  title,
  description,
  href,
  rows,
  columns,
  loading,
}: {
  title: string
  description: string
  href: string
  rows: RecordValue[]
  columns: Array<{ key: string; label: string; render?: (record: RecordValue) => React.ReactNode }>
  loading?: boolean
}) {
  return (
    <AccessCard
      title={title}
      description={description}
      action={
        <Button asChild variant="ghost" size="sm" className="-mr-2 text-primary hover:text-primary">
          <Link href={href}>
            View all
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      }
    >
      <TableShell className="border-0 bg-transparent">
        <table className="w-full min-w-[500px] text-sm">
          <thead className="border-b bg-muted/50 text-left text-xs font-medium text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-medium">{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row.id)} className="data-table-row border-b border-border/60 last:border-b-0">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3.5">
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
            <TableEmpty title="No records yet" description="Records will appear here as gym activity is added." />
          </div>
        ) : null}
      </TableShell>
    </AccessCard>
  )
}

type TrendPoint = { day: string; revenue: number; attendance: number }

function DashboardCharts({ trend }: { trend: TrendPoint[] }) {
  const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--popover-foreground)" }
  return <section className="grid gap-5 2xl:grid-cols-2">
    <AccessCard title="Revenue this week" description="Paid membership payments recorded over the last seven days.">
      <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend} margin={{ top: 12, right: 8, left: -12, bottom: 0 }}><defs><linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.38} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickFormatter={(value) => `$${value}`} /><Tooltip contentStyle={tooltipStyle} formatter={(value) => [currency(value), "Revenue"]} /><Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2.5} fill="url(#revenue-fill)" /></AreaChart></ResponsiveContainer></div>
    </AccessCard>
    <AccessCard title="Attendance this week" description="Present member check-ins recorded each day over the last seven days.">
      <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={trend} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} /><Tooltip contentStyle={tooltipStyle} formatter={(value) => [value, "Check-ins"]} /><Bar dataKey="attendance" name="Check-ins" fill="var(--chart-2)" radius={[5, 5, 0, 0]} maxBarSize={38} /></BarChart></ResponsiveContainer></div>
    </AccessCard>
  </section>
}

export function GymDashboardPage() {
  const { data, isLoading } = useGymDashboard()
  const stats = (data?.stats ?? {}) as Record<string, unknown>

  const cards = [
    { label: "Total members", value: String(stats.totalMembers ?? 0), icon: Users, tone: "primary" as const },
    { label: "Active subscriptions", value: String(stats.activeSubscriptions ?? 0), icon: Dumbbell, tone: "sky" as const, emphasis: "lime" as const },
    { label: "Total trainers", value: String(stats.totalTrainers ?? 0), icon: UserCheck, tone: "amber" as const },
    { label: "Expired subscriptions", value: String(stats.expiredSubscriptions ?? 0), icon: CalendarClock, tone: "amber" as const },
    { label: "Today's attendance", value: String(stats.todayAttendance ?? 0), icon: Activity, tone: "primary" as const },
    { label: "Monthly revenue", value: currency(stats.monthlyRevenue), icon: WalletCards, tone: "sky" as const, emphasis: "navy" as const },
    { label: "Pending payments", value: String(stats.pendingPayments ?? 0), icon: CreditCard, tone: "rose" as const },
    { label: "Notifications this month", value: String(stats.recentNotifications ?? 0), icon: Bell, tone: "primary" as const },
  ]

  return (
    <div className="gym-dashboard space-y-6">
      <section className="flex justify-end">
        <Button asChild variant="outline" className="h-10 shrink-0 border-[var(--brand-navy)]/20 bg-[var(--brand-navy-soft)] text-[var(--brand-navy)] hover:bg-[var(--brand-navy)] hover:text-white">
          <Link href="/reports">View reports</Link>
        </Button>
      </section>

      <section aria-label="Gym overview metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => <MetricCard key={card.label} {...card} />)}
      </section>

      <DashboardCharts trend={((data?.charts as { weeklyRevenue?: TrendPoint[] } | undefined)?.weeklyRevenue ?? [])} />

      <section className="grid gap-5 2xl:grid-cols-2">
        <MiniTable
          title="Recent members"
          description="Latest people added to the gym."
          href="/members"
          rows={(data?.recentMembers as RecordValue[] | undefined) ?? []}
          loading={isLoading}
          columns={[
            { key: "fullName", label: "Member" },
            { key: "phoneNumber", label: "Phone" },
            { key: "status", label: "Status", render: (record) => <StatusPill value={String(record.status)} /> },
          ]}
        />
        <MiniTable
          title="Recent payments"
          description="Most recent recorded membership payments."
          href="/payments"
          rows={(data?.recentPayments as RecordValue[] | undefined) ?? []}
          loading={isLoading}
          columns={[
            { key: "member.fullName", label: "Member" },
            { key: "amount", label: "Amount", render: (record) => currency(record.amount) },
            { key: "status", label: "Status", render: (record) => <StatusPill value={String(record.status)} /> },
          ]}
        />
        <MiniTable
          title="Expiring subscriptions"
          description="Active subscriptions ending in the next 30 days."
          href="/subscriptions"
          rows={(data?.expiringSubscriptions as RecordValue[] | undefined) ?? []}
          loading={isLoading}
          columns={[
            { key: "member.fullName", label: "Member" },
            { key: "plan.name", label: "Plan" },
            { key: "expiryDate", label: "Expiry", render: (record) => shortDate(record.expiryDate) },
          ]}
        />
        <MiniTable
          title="Today's attendance"
          description="Member check-ins recorded today."
          href="/attendance"
          rows={(data?.todayAttendance as RecordValue[] | undefined) ?? []}
          loading={isLoading}
          columns={[
            { key: "member.fullName", label: "Member" },
            { key: "checkInDate", label: "Check-in", render: (record) => shortDate(record.checkInDate) },
            { key: "status", label: "Status", render: (record) => <Pill variant="secondary">{String(record.status).replaceAll("_", " ")}</Pill> },
          ]}
        />
      </section>
    </div>
  )
}
