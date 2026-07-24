"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { toast } from "sonner"

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
      { key: "fullName", label: "Member Name" },
      { key: "phoneNumber", label: "Phone Number" },
      { key: "email", label: "Email" },
      { key: "trainer.fullName", label: "Assigned Trainer" },
      { key: "status", label: "Status", render: (row: RecordValue) => <StatusPill value={String(row.status)} /> },
      { key: "createdAt", label: "Created Date", render: (row: RecordValue) => shortDate(row.createdAt) },
    ]
  }

  if (report === "subscriptions") {
    return [
      { key: "member.fullName", label: "Member Name" },
      { key: "plan.name", label: "Plan Name" },
      { key: "plan.type", label: "Plan Type", render: (row: RecordValue) => <StatusPill value={String(nested(row, "plan.type"))} /> },
      { key: "startDate", label: "Start Date", render: (row: RecordValue) => shortDate(row.startDate) },
      { key: "expiryDate", label: "Expiry Date", render: (row: RecordValue) => shortDate(row.expiryDate) },
      { key: "status", label: "Subscription Status", render: (row: RecordValue) => <StatusPill value={String(row.status)} /> },
      { key: "paymentStatus", label: "Payment Status", render: (row: RecordValue) => <StatusPill value={String(row.paymentStatus)} /> },
    ]
  }

  if (report === "payments" || report === "revenue") {
    return [
      { key: "member.fullName", label: "Member Name" },
      { key: "plan.name", label: "Plan Name" },
      { key: "amount", label: "Amount", render: (row: RecordValue) => currency(row.amount) },
      { key: "currency", label: "Currency" },
      { key: "method", label: "Payment Method", render: (row: RecordValue) => <StatusPill value={String(row.method)} /> },
      { key: "status", label: "Payment Status", render: (row: RecordValue) => <StatusPill value={String(row.status)} /> },
      { key: "paymentDate", label: "Payment Date", render: (row: RecordValue) => shortDate(row.paymentDate) },
      { key: "reference", label: "Reference" },
    ]
  }

  return [
    { key: "member.fullName", label: "Member Name" },
    { key: "checkInDate", label: "Check-in Date", render: (row: RecordValue) => shortDate(row.checkInDate) },
    { key: "method", label: "Method", render: (row: RecordValue) => <StatusPill value={String(row.method)} /> },
    { key: "status", label: "Attendance Status", render: (row: RecordValue) => <StatusPill value={String(row.status)} /> },
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
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null)

  const { data, isLoading } = useReport(report, { page, limit, search, status, dateFrom, dateTo })
  const rows = (data?.rows as RecordValue[] | undefined) ?? []
  const pagination = data?.pagination as { page: number; pages: number; total: number } | undefined
  const columns = columnsFor(report)

  const exportReport = async (format: "csv" | "pdf") => {
    setExporting(format)
    try {
      const params = new URLSearchParams()
      params.set("format", format)
      params.set("search", search)
      params.set("status", status)
      params.set("dateFrom", dateFrom)
      params.set("dateTo", dateTo)
      const response = await fetch(`/api/v1/reports/${report}/export?${params.toString()}`)
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to export report" }))
        throw new Error(error.error || "Failed to export report")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${report}-${new Date().toISOString().slice(0, 10)}.${format}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success(`${format.toUpperCase()} report exported`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export report")
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-5">
      <AccessPageHeader
        breadcrumb={["Dashboard", "Reports"]}
        title="Reports"
        description="Filter gym performance data across members, subscriptions, payments, attendance, and revenue."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={() => exportReport("csv")} disabled={Boolean(exporting)}>
              <Download className="h-4 w-4" />
              {exporting === "csv" ? "Exporting..." : "CSV"}
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => exportReport("pdf")} disabled={Boolean(exporting)}>
              <Download className="h-4 w-4" />
              {exporting === "pdf" ? "Exporting..." : "PDF"}
            </Button>
          </div>
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

      <AccessCard title={reportOptions.find((item) => item.value === report)?.label ?? "Report"} description="Results are protected by reports.view. CSV and PDF exports use reports.export.">
        <TableShell>
          <table className="w-full min-w-[760px] text-sm">
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
