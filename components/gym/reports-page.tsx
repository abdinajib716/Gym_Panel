"use client"

import { useState } from "react"
import { Download } from "lucide-react"

import {
  AccessCard,
  AccessPageHeader,
  AccessSearchField,
  AccessToolbar,
  PaginationControls,
  SelectField,
  TableEmpty,
  TableShell,
  TableSkeleton,
} from "@/components/access-control/shared"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useReport } from "@/lib/swr"
import { currency, shortDate, StatusPill } from "@/components/gym/crud-page"

type RecordValue = Record<string, unknown>

const reportOptions = [
  { label: "Member report", value: "members" },
  { label: "Subscription report", value: "subscriptions" },
  { label: "Payment report", value: "payments" },
  { label: "Attendance report", value: "attendance" },
  { label: "Revenue report", value: "revenue" },
]

function nested(record: RecordValue, key: string) {
  return key.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") return undefined
    return (current as RecordValue)[part]
  }, record)
}

function columnsFor(report: string) {
  if (report === "members") {
    return [
      { key: "fullName", label: "Member" },
      { key: "phoneNumber", label: "Phone" },
      { key: "status", label: "Status", render: (row: RecordValue) => <StatusPill value={String(row.status)} /> },
      { key: "createdAt", label: "Created", render: (row: RecordValue) => shortDate(row.createdAt) },
    ]
  }

  if (report === "subscriptions") {
    return [
      { key: "member.fullName", label: "Member" },
      { key: "plan.name", label: "Plan" },
      { key: "status", label: "Status", render: (row: RecordValue) => <StatusPill value={String(row.status)} /> },
      { key: "expiryDate", label: "Expiry", render: (row: RecordValue) => shortDate(row.expiryDate) },
    ]
  }

  if (report === "payments" || report === "revenue") {
    return [
      { key: "member.fullName", label: "Member" },
      { key: "amount", label: "Amount", render: (row: RecordValue) => currency(row.amount) },
      { key: "status", label: "Status", render: (row: RecordValue) => <StatusPill value={String(row.status)} /> },
      { key: "paymentDate", label: "Date", render: (row: RecordValue) => shortDate(row.paymentDate) },
    ]
  }

  return [
    { key: "member.fullName", label: "Member" },
    { key: "checkInDate", label: "Check-in", render: (row: RecordValue) => shortDate(row.checkInDate) },
    { key: "status", label: "Status", render: (row: RecordValue) => <StatusPill value={String(row.status)} /> },
  ]
}

export function ReportsPage() {
  const [report, setReport] = useState("members")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const { data, isLoading } = useReport(report, { page, limit, search, status, dateFrom, dateTo })
  const rows = (data?.rows as RecordValue[] | undefined) ?? []
  const pagination = data?.pagination as { page: number; pages: number; total: number } | undefined
  const columns = columnsFor(report)

  return (
    <div className="space-y-5">
      <AccessPageHeader
        breadcrumb={["Dashboard", "Reports"]}
        title="Reports"
        description="Filter gym performance data across members, subscriptions, payments, attendance, and revenue."
        action={
          <Button variant="outline" className="gap-2" disabled>
            <Download className="h-4 w-4" />
            Export later
          </Button>
        }
      />

      <AccessToolbar>
        <div className="flex flex-1 flex-col gap-3 xl:flex-row xl:items-center">
          <SelectField
            value={report}
            onChange={(value) => {
              setReport(value)
              setPage(1)
            }}
            options={reportOptions}
            className="md:max-w-56"
          />
          <AccessSearchField
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
            placeholder="Search report rows"
          />
          <Input value={status} onChange={(event) => setStatus(event.target.value)} placeholder="Status filter" className="md:max-w-40" />
          <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="md:max-w-40" />
          <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="md:max-w-40" />
          <SelectField
            value={String(limit)}
            onChange={(value) => {
              setLimit(Number(value))
              setPage(1)
            }}
            options={[10, 20, 30, 50].map((value) => ({ label: String(value), value: String(value) }))}
            className="w-auto"
          />
        </div>
        {data?.totalRevenue !== undefined ? (
          <p className="text-sm font-medium">Revenue: {currency(data.totalRevenue)}</p>
        ) : (
          <p className="text-sm text-muted-foreground">{pagination?.total ?? 0} report rows</p>
        )}
      </AccessToolbar>

      <AccessCard title={reportOptions.find((item) => item.value === report)?.label ?? "Report"} description="Results are protected by reports.view. Export will be added later behind reports.export.">
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
          {isLoading ? <TableSkeleton columns={columns.length} rows={5} /> : null}
          {!isLoading && rows.length === 0 ? (
            <div className="p-4">
              <TableEmpty title="No report rows found" description="Adjust your filters or add gym records first." />
            </div>
          ) : null}
          {pagination ? (
            <PaginationControls page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={setPage} />
          ) : null}
        </TableShell>
      </AccessCard>
    </div>
  )
}
