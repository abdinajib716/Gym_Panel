"use client"

import { useMemo, useState } from "react"
import { Filter, History } from "lucide-react"

import {
  AccessCard,
  AccessPageHeader,
  AccessSearchField,
  AccessToolbar,
  PaginationControls,
  Pill,
  TableSkeleton,
  TableEmpty,
  TableShell,
  formatAuditDate,
} from "@/components/access-control/shared"
import { Button } from "@/components/ui/button"
import { useAccessActivityLogs } from "@/lib/swr"

const typeOptions = [
  { label: "All types", value: "" },
  { label: "Settings", value: "settings" },
  { label: "Users", value: "users" },
  { label: "Roles", value: "roles" },
  { label: "Permissions", value: "permissions" },
]

export function AccessControlActivityLogsPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState("")
  const [type, setType] = useState("")
  const [sort, setSort] = useState("date-desc")

  const { data, isLoading } = useAccessActivityLogs({ page, limit, search, type, sort })
  const logs = data?.logs ?? []

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (search) count += 1
    if (type) count += 1
    if (sort !== "date-desc") count += 1
    return count
  }, [search, sort, type])

  return (
    <div className="space-y-5">
      <AccessPageHeader
        breadcrumb={["Dashboard", "Access Control", "Activity Logs"]}
        title="Activity Logs"
        description="Audit system actions with searchable records."
      />

      <AccessToolbar>
        <div className="flex flex-1 flex-col gap-3 xl:flex-row xl:items-center">
          <AccessSearchField value={search} onChange={(value) => {
            setSearch(value)
            setPage(1)
          }} placeholder="Search activity, subject, or user" />
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={type}
              onChange={(event) => {
                setType(event.target.value)
                setPage(1)
              }}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]"
            >
              {typeOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value)
                setPage(1)
              }}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]"
            >
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
            </select>
            <div className="flex items-center gap-2 rounded-full border border-border/70 px-3 py-1.5 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {activeFilterCount > 0 ? (
                <Pill variant="default" className="bg-primary text-white">
                  {activeFilterCount}
                </Pill>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Per page</span>
              <select
                value={limit}
                onChange={(event) => {
                  setLimit(Number(event.target.value))
                  setPage(1)
                }}
                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]"
              >
                {[10, 20, 30, 50].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setSearch("")
            setType("")
            setSort("date-desc")
            setLimit(10)
            setPage(1)
          }}
        >
          Reset
        </Button>
      </AccessToolbar>

      <AccessCard title="Audit Trail" description="A searchable history of system activity.">
        <TableShell>
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-muted/45 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3"><input type="checkbox" aria-label="Select all logs" /></th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Activity</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-border/70">
                  <td className="px-4 py-3 align-top">
                    <input type="checkbox" aria-label={`Select log ${log.id}`} />
                  </td>
                  <td className="px-4 py-3">
                    <Pill variant="secondary" className="bg-primary/10 text-primary">
                      {log.type.replaceAll("-", " ")}
                    </Pill>
                  </td>
                  <td className="px-4 py-3 font-medium">{log.activity}</td>
                  <td className="px-4 py-3">{log.subject}</td>
                  <td className="px-4 py-3 text-muted-foreground">{log.userDisplay || "System"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatAuditDate(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && logs.length === 0 ? (
            <div className="p-4">
              <TableEmpty title="No activity logs found" description="Adjust the search or filters to find the audit event you need." />
            </div>
          ) : null}
          {isLoading ? <TableSkeleton columns={6} rows={5} /> : null}
          {data?.pagination ? (
            <PaginationControls
              page={data.pagination.page}
              pages={data.pagination.pages}
              total={data.pagination.total}
              onPageChange={setPage}
            />
          ) : null}
        </TableShell>

        <div className="mt-4 rounded-xl border border-dashed border-border/70 bg-muted/30 px-4 py-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <History className="h-4 w-4 text-primary" />
            <span>Use filters to narrow the audit trail quickly.</span>
          </div>
        </div>
      </AccessCard>
    </div>
  )
}
