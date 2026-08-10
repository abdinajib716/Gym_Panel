"use client"

import { Activity, ArrowRight, Bell, CalendarClock, CreditCard, Dumbbell, Users, UserCheck, WalletCards } from "lucide-react"
import Link from "next/link"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { AccessCard, AccessPageHeader, Pill, TableEmpty, TableShell, TableSkeleton } from "@/components/access-control/shared"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useGymDashboard } from "@/lib/swr"
import { currency, shortDate, StatusPill } from "@/components/gym/crud-page"

type RecordValue = Record<string, unknown>

function nested(record: RecordValue, key: string) {
  return key.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") return undefined
    return (current as RecordValue)[part]
  }, record)
}

function MemberProfileCell({ record, path }: { record: RecordValue; path?: string }) {
  const member = path ? nested(record, path) : record
  const profile = member && typeof member === "object" ? member as RecordValue : record
  const name = String(profile.fullName ?? profile.name ?? "Member")
  const image = profile.profileImage as string | null | undefined
  const contact = String(profile.phoneNumber ?? profile.email ?? "")
  const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()

  return (
    <div className="flex min-w-44 items-center gap-3">
      <Avatar className="size-9 ring-2 ring-primary/15">
        <AvatarImage src={image || undefined} alt={name} />
        <AvatarFallback className="bg-primary/15 text-xs font-bold text-[var(--brand-navy)]">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-semibold text-foreground">{name}</p>
        {contact ? <p className="truncate text-xs text-muted-foreground">{contact}</p> : null}
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  emphasis,
  trend,
}: {
  label: string
  value: React.ReactNode
  icon: React.ComponentType<{ className?: string }>
  tone?: "primary" | "sky" | "amber" | "rose"
  emphasis?: "navy" | "lime"
  trend?: number[]
}) {
  const toneClasses = {
    primary: "metric-icon-success",
    sky: "metric-icon-info",
    amber: "metric-icon-navy",
    rose: "metric-icon-danger",
  }

  return (
    <div className={`gym-metric-card rounded-lg border p-5 shadow-sm transition-shadow hover:shadow-md ${emphasis === "navy" ? "gym-metric-navy bg-[var(--brand-navy)] text-white border-transparent" : emphasis === "lime" ? "gym-metric-lime bg-primary text-primary-foreground border-transparent" : "bg-card"}`}>
      <div className="flex items-center justify-between gap-3">
        <p className={`text-[11px] font-bold uppercase tracking-[0.1em] ${emphasis ? "text-current/75" : "text-muted-foreground"}`}>{label}</p>
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${emphasis ? "bg-white/18 text-current" : toneClasses[tone]}`}>
          <Icon className="size-4" />
        </div>
      </div>
      <div className="mt-5">
        <p className={`text-[1.7rem] font-bold leading-none tracking-tight ${emphasis ? "text-current" : "text-foreground"}`}>{value}</p>
      </div>
      {trend ? <MiniTrend values={trend} tone={tone} /> : null}
    </div>
  )
}

function MiniTrend({ values, tone }: { values: number[]; tone: "primary" | "sky" | "amber" | "rose" }) {
  const maximum = Math.max(...values, 1)
  const minimum = Math.min(...values, 0)
  const range = Math.max(maximum - minimum, 1)
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 100},${26 - ((value - minimum) / range) * 20}`).join(" ")
  const stroke = tone === "rose" ? "var(--status-danger)" : tone === "sky" ? "var(--brand-navy)" : "var(--status-success)"

  return (
    <svg className="mt-4 h-7 w-full" viewBox="0 0 100 28" preserveAspectRatio="none" aria-label="Weekly trend" role="img">
      <line x1="0" x2="100" y1="26.5" y2="26.5" stroke="var(--border)" strokeWidth="1" />
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
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
      <TableShell>
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

type RevenueTrendPoint = { day: string; revenue: number }
type AttendanceTrendPoint = { day: string; attendance: number }

function DashboardCharts({ revenueTrend, attendanceTrend }: { revenueTrend: RevenueTrendPoint[]; attendanceTrend: AttendanceTrendPoint[] }) {
  const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--popover-foreground)" }
  return <section className="grid gap-6 2xl:grid-cols-2">
    <AccessCard title="Revenue this week" description="Paid membership payments recorded over the last seven days.">
      <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={revenueTrend} margin={{ top: 12, right: 8, left: -12, bottom: 0 }}><defs><linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.38} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickFormatter={(value) => `$${value}`} /><Tooltip contentStyle={tooltipStyle} formatter={(value) => [currency(value), "Revenue"]} /><Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2.5} fill="url(#revenue-fill)" /></AreaChart></ResponsiveContainer></div>
    </AccessCard>
    <AccessCard title="Attendance this week" description="Present member check-ins recorded each day over the last seven days.">
      <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={attendanceTrend} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} /><Tooltip contentStyle={tooltipStyle} formatter={(value) => [value, "Check-ins"]} /><Bar dataKey="attendance" name="Check-ins" fill="var(--chart-2)" radius={[5, 5, 0, 0]} maxBarSize={38} /></BarChart></ResponsiveContainer></div>
    </AccessCard>
  </section>
}

export function GymDashboardPage() {
  const { data, isLoading } = useGymDashboard()
  const stats = (data?.stats ?? {}) as Record<string, unknown>
  const revenueTrend = ((data?.charts as { weeklyRevenue?: RevenueTrendPoint[] } | undefined)?.weeklyRevenue ?? [])
  const attendanceTrend = ((data?.charts as { weeklyAttendance?: AttendanceTrendPoint[] } | undefined)?.weeklyAttendance ?? [])
  const cardTrends = ((data?.charts as { cardTrends?: Record<string, number[]> } | undefined)?.cardTrends ?? {})

  const cards = [
    { label: "Total members", value: String(stats.totalMembers ?? 0), icon: Users, tone: "primary" as const, trend: cardTrends.totalMembers },
    { label: "Active subscriptions", value: String(stats.activeSubscriptions ?? 0), icon: Dumbbell, tone: "primary" as const, trend: cardTrends.activeSubscriptions },
    { label: "Total trainers", value: String(stats.totalTrainers ?? 0), icon: UserCheck, tone: "amber" as const, trend: cardTrends.totalTrainers },
    { label: "Expired subscriptions", value: String(stats.expiredSubscriptions ?? 0), icon: CalendarClock, tone: "amber" as const, trend: cardTrends.expiredSubscriptions },
    { label: "Today's attendance", value: String(stats.todayAttendance ?? 0), icon: Activity, tone: "primary" as const, trend: cardTrends.todayAttendance ?? attendanceTrend.map((point) => point.attendance) },
    { label: "Monthly revenue", value: currency(stats.monthlyRevenue), icon: WalletCards, tone: "sky" as const, trend: cardTrends.monthlyRevenue ?? revenueTrend.map((point) => point.revenue) },
    { label: "Pending payments", value: String(stats.pendingPayments ?? 0), icon: CreditCard, tone: "rose" as const, trend: cardTrends.pendingPayments },
    { label: "Notifications this month", value: String(stats.recentNotifications ?? 0), icon: Bell, tone: "primary" as const, trend: cardTrends.recentNotifications },
  ]

  return (
    <div className="gym-dashboard space-y-6">
      <AccessPageHeader
        breadcrumb={["Dashboard"]}
        title="Dashboard"
        description="Monitor members, payments, attendance, and subscriptions from one place."
        action={<Button asChild variant="outline" className="h-10 shrink-0 border-[var(--brand-navy)]/20 bg-[var(--brand-navy-soft)] text-[var(--brand-navy)] hover:bg-[var(--brand-navy)] hover:text-white"><Link href="/reports">View reports</Link></Button>}
      />

      <section aria-label="Gym overview metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => <MetricCard key={card.label} {...card} />)}
      </section>

      <DashboardCharts
        revenueTrend={revenueTrend}
        attendanceTrend={attendanceTrend}
      />

      <section className="grid gap-6 2xl:grid-cols-2">
        <MiniTable
          title="Recent members"
          description="Latest people added to the gym."
          href="/members"
          rows={(data?.recentMembers as RecordValue[] | undefined) ?? []}
          loading={isLoading}
          columns={[
            { key: "fullName", label: "Member", render: (record) => <MemberProfileCell record={record} /> },
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
            { key: "member.fullName", label: "Member", render: (record) => <MemberProfileCell record={record} path="member" /> },
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
            { key: "member.fullName", label: "Member", render: (record) => <MemberProfileCell record={record} path="member" /> },
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
            { key: "member.fullName", label: "Member", render: (record) => <MemberProfileCell record={record} path="member" /> },
            { key: "checkInDate", label: "Check-in", render: (record) => shortDate(record.checkInDate) },
            { key: "status", label: "Status", render: (record) => <Pill variant="secondary">{String(record.status).replaceAll("_", " ")}</Pill> },
          ]}
        />
      </section>
    </div>
  )
}
