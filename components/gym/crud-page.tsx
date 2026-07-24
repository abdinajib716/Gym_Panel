"use client"

import { useEffect, useMemo, useState } from "react"
import { Copy, Eye, EyeOff, KeyRound, Mail, Plus, ShieldCheck, ShieldX, Trash2 } from "lucide-react"
import useSWR from "swr"
import { toast } from "sonner"

import {
  AccessCard,
  AccessPageHeader,
  AccessSearchField,
  AccessToolbar,
  FieldBlock,
  PaginationControls,
  Pill,
  SelectField,
  TableEmpty,
  TableShell,
  TableSkeleton,
} from "@/components/access-control/shared"
import { LocalImageUpload } from "@/components/access-control/local-image-upload"
import { RowActions, defaultActionIcons } from "@/components/access-control/row-actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { apiRequest } from "@/lib/client-api"
import { fetcher } from "@/lib/swr"

type Primitive = string | number | boolean | null | undefined
type RecordValue = Record<string, unknown>

type Option = {
  label: string
  value: string
}

type Field = {
  name: string
  label: string
  type?: "text" | "email" | "number" | "date" | "datetime-local" | "textarea" | "select" | "image"
  section?: string
  placeholder?: string
  options?: Option[]
  optionsSource?: string
  optionLabel?: string
  optionValue?: string
  className?: string
  hideOnCreate?: boolean
  hideOnEdit?: boolean
}

type Column = {
  key: string
  label: string
  render?: (record: RecordValue) => React.ReactNode
}

type CrudPageProps = {
  title: string
  description: string
  breadcrumb: string[]
  endpoint: string
  dataKey: string
  recordName: string
  searchPlaceholder: string
  columns: Column[]
  detailFields?: Column[]
  fields: Field[]
  defaultValues: Record<string, Primitive>
  statusOptions?: Option[]
  typeOptions?: Option[]
  methodOptions?: Option[]
  methodFilterLabel?: string
  showDateFilters?: boolean
  allowCreate?: boolean
  allowEdit?: boolean
  allowDelete?: boolean
  bulkDeleteResource?: string
}

function getValue(record: RecordValue, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined
    return (current as Record<string, unknown>)[key]
  }, record)
}

function formatDateInput(value: unknown) {
  if (!value) return ""
  return new Date(String(value)).toISOString().slice(0, 10)
}

function formatDateTimeInput(value: unknown) {
  if (!value) return ""
  const date = new Date(String(value))
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

function formatCell(value: unknown) {
  if (value === null || value === undefined || value === "") return "-"
  if (value instanceof Date) return value.toLocaleDateString()
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value))
  }
  return String(value).replaceAll("_", " ")
}

function humanLabel(value: string) {
  return value
    .replace(/Id$/i, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function relationTitle(key: string, count: number) {
  const titles: Record<string, string> = {
    subscriptions: "Memberships",
    payments: "Payments",
    attendance: "Attendance",
    notifications: "Notifications",
  }
  const singularTitles: Record<string, string> = {
    subscriptions: "Membership",
    payments: "Payment",
    attendance: "Attendance Record",
    notifications: "Notification",
  }
  const title = titles[key] || humanLabel(key)
  return count === 1 ? `1 ${singularTitles[key] || title}` : `${count} ${title}`
}

function readablePairs(key: string, entry: RecordValue): Array<{ label: string; value: unknown }> {
  if (key === "subscriptions") {
    return [
      { label: "Plan", value: getValue(entry, "plan.name") },
      { label: "Period", value: `${shortDate(entry.startDate)} to ${shortDate(entry.expiryDate)}` },
      { label: "Membership Status", value: entry.status },
      { label: "Payment Status", value: entry.paymentStatus },
      { label: "Plan Price", value: getValue(entry, "plan.price") ? currency(getValue(entry, "plan.price")) : undefined },
    ]
  }

  if (key === "payments") {
    return [
      { label: "Amount", value: currency(entry.amount) },
      { label: "Payment Status", value: entry.status },
      { label: "Payment Method", value: entry.method },
      { label: "Payment Date", value: shortDate(entry.paymentDate) },
      { label: "Plan", value: getValue(entry, "plan.name") ?? getValue(entry, "subscription.plan.name") },
      { label: "Reference", value: entry.reference ?? entry.transactionId ?? entry.orderId ?? entry.requestId },
      { label: "Waafi Message", value: entry.responseMessage ?? entry.failedReason },
    ]
  }

  if (key === "attendance") {
    return [
      { label: "Check-in Date", value: shortDate(entry.checkInDate) },
      { label: "Status", value: entry.status },
      { label: "Recorded By", value: entry.method },
    ]
  }

  if (key === "notifications") {
    return [
      { label: "Title", value: entry.title },
      { label: "Message", value: entry.message },
      { label: "Type", value: entry.type },
      { label: "Read Status", value: entry.readStatus },
      { label: "Sent", value: shortDate(entry.createdAt) },
    ]
  }

  return Object.entries(entry)
    .filter(([entryKey, entryValue]) => {
      if (entryKey === "id" || entryKey.endsWith("Id")) return false
      return ["string", "number", "boolean"].includes(typeof entryValue)
    })
    .slice(0, 5)
    .map(([entryKey, entryValue]) => ({ label: humanLabel(entryKey), value: entryValue }))
}

function optionLabel(item: unknown, field: Field) {
  if (!item || typeof item !== "object") return ""
  const record = item as RecordValue
  if (field.optionsSource === "subscriptions") {
    const member = getValue(record, "member.fullName")
    const plan = getValue(record, "plan.name")
    return `${member || "Member"} - ${plan || "Plan"}`
  }
  return String(getValue(record, field.optionLabel ?? "name") ?? getValue(record, "fullName") ?? getValue(record, "title") ?? "")
}

function getOptions(data: RecordValue | undefined, field: Field): Option[] {
  if (field.options) return field.options
  if (!field.optionsSource || !data) return []
  const source = data[field.optionsSource]
  if (!Array.isArray(source)) return []
  return source.map((item) => ({
    label: optionLabel(item, field),
    value: String(getValue(item as RecordValue, field.optionValue ?? "id") ?? ""),
  }))
}

function prepareEditValues(record: RecordValue, fields: Field[]) {
  return fields.reduce<Record<string, Primitive>>((values, field) => {
    const value = getValue(record, field.name)
    if (field.type === "date") {
      values[field.name] = formatDateInput(value)
    } else if (field.type === "datetime-local") {
      values[field.name] = formatDateTimeInput(value)
    } else {
      values[field.name] = (value as Primitive) ?? ""
    }
    return values
  }, {})
}

export function CrudPage({
  title,
  description,
  breadcrumb,
  endpoint,
  dataKey,
  recordName,
  searchPlaceholder,
  columns,
  detailFields,
  fields,
  defaultValues,
  statusOptions,
  typeOptions,
  methodOptions,
  methodFilterLabel = "All methods",
  showDateFilters = false,
  allowCreate = true,
  allowEdit = true,
  allowDelete = true,
  bulkDeleteResource: bulkDeleteResourceOverride,
}: CrudPageProps) {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [type, setType] = useState("")
  const [method, setMethod] = useState("")
  const [period, setPeriod] = useState("")
  const [customDate, setCustomDate] = useState("")
  const [open, setOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<RecordValue | null>(null)
  const [viewRecord, setViewRecord] = useState<RecordValue | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [loadingCredentials, setLoadingCredentials] = useState(false)
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null)
  const [showTemporaryPassword, setShowTemporaryPassword] = useState(false)
  const [formValues, setFormValues] = useState<Record<string, Primitive>>(defaultValues)
  const [submitting, setSubmitting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const query = useMemo(() => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("limit", String(limit))
    if (search) params.set("search", search)
    if (status) params.set("status", status)
    if (type) params.set("type", type)
    if (method) params.set("method", method)
    if (showDateFilters && period) params.set("period", period)
    if (showDateFilters && period === "custom" && customDate) params.set("customDate", customDate)
    return `${endpoint}?${params.toString()}`
  }, [customDate, endpoint, limit, method, page, period, search, showDateFilters, status, type])

  const { data, mutate, isLoading } = useSWR<RecordValue>(query, fetcher)
  const records = (data?.[dataKey] as RecordValue[] | undefined) ?? []
  const pagination = data?.pagination as { page: number; pages: number; total: number } | undefined
  const detailsColumns = detailFields ?? columns
  const bulkDeleteResource = bulkDeleteResourceOverride || endpoint.split("/").filter(Boolean).pop() || dataKey
  const visibleRecordIds = records.map((record) => String(record.id)).filter(Boolean)
  const allVisibleSelected = visibleRecordIds.length > 0 && visibleRecordIds.every((id) => selectedIds.includes(id))

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => visibleRecordIds.includes(id)))
  }, [visibleRecordIds.join("|")])

  const openCreate = () => {
    setEditingRecord(null)
    setFormValues(defaultValues)
    setOpen(true)
  }

  const openEdit = (record: RecordValue) => {
    setEditingRecord(record)
    setFormValues({ ...defaultValues, ...prepareEditValues(record, fields.filter((field) => !field.hideOnEdit)) })
    setOpen(true)
  }

  const openDetails = async (record: RecordValue) => {
    setViewRecord(record)
    setTemporaryPassword(null)
    setShowTemporaryPassword(false)
    setDetailsOpen(true)
    setLoadingDetails(true)
    try {
      const response = await apiRequest<Record<string, unknown>>(`${endpoint}/${record.id}`)
      const detail = response[recordName] as RecordValue | undefined
      setViewRecord(detail ?? record)
    } catch {
      setViewRecord(record)
    } finally {
      setLoadingDetails(false)
    }
  }

  const supportsLoginDetails = recordName === "member" || recordName === "trainer"
  const loginAccount = viewRecord?.mobileAccount as RecordValue | null | undefined

  const loadLoginDetails = async () => {
    if (!viewRecord?.id || !supportsLoginDetails) return
    setLoadingCredentials(true)
    try {
      const response = await apiRequest<{ temporaryPassword: string | null }>(`${endpoint}/${viewRecord.id}/login-details`)
      setTemporaryPassword(response.temporaryPassword)
      setShowTemporaryPassword(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load login details")
    } finally {
      setLoadingCredentials(false)
    }
  }

  const resendWelcomeEmail = async () => {
    if (!viewRecord?.id || !supportsLoginDetails) return
    setLoadingCredentials(true)
    try {
      const response = await apiRequest<{ message: string }>(`${endpoint}/${viewRecord.id}/resend-welcome-email`, {
        method: "POST",
      })
      toast.success(response.message)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resend welcome email")
    } finally {
      setLoadingCredentials(false)
    }
  }

  const resetTrainerPassword = async () => {
    if (!viewRecord?.id || recordName !== "trainer") return
    setLoadingCredentials(true)
    try {
      const response = await apiRequest<{ message: string; temporaryPassword: string }>(`${endpoint}/${viewRecord.id}/reset-password`, { method: "POST" })
      setTemporaryPassword(response.temporaryPassword)
      setShowTemporaryPassword(true)
      toast.success(response.message)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reset password")
    } finally {
      setLoadingCredentials(false)
    }
  }

  const setTrainerAccountStatus = async (status: "ACTIVE" | "SUSPENDED") => {
    if (!viewRecord?.id || recordName !== "trainer") return
    setLoadingCredentials(true)
    try {
      const response = await apiRequest<{ message: string }>(`${endpoint}/${viewRecord.id}/account`, { method: "PUT", body: { status } })
      toast.success(response.message)
      await openDetails(viewRecord)
      mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update login status")
    } finally {
      setLoadingCredentials(false)
    }
  }

  const copyLoginDetails = async () => {
    const username = String(loginAccount?.username ?? loginAccount?.loginEmail ?? loginAccount?.loginPhone ?? "")
    const passwordText = temporaryPassword ? `Temporary Password: ${temporaryPassword}` : "Temporary Password: Hidden"
    await navigator.clipboard.writeText(`Username: ${username}\n${passwordText}`)
    toast.success("Login details copied")
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      const id = editingRecord?.id
      const response = await apiRequest<{ message: string }>(id ? `${endpoint}/${id}` : endpoint, {
        method: id ? "PUT" : "POST",
        body: formValues,
      })
      toast.success(response.message)
      setOpen(false)
      setEditingRecord(null)
      setFormValues(defaultValues)
      mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to save ${recordName}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (record: RecordValue) => {
    try {
      const response = await apiRequest<{ message: string }>(`${endpoint}/${record.id}`, {
        method: "DELETE",
      })
      toast.success(response.message)
      mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to delete ${recordName}`)
    }
  }

  const toggleRecordSelection = (id: string, checked: boolean) => {
    setSelectedIds((current) => checked ? Array.from(new Set([...current, id])) : current.filter((item) => item !== id))
  }

  const toggleAllVisible = (checked: boolean) => {
    setSelectedIds(checked ? visibleRecordIds : [])
  }

  const handleBulkDelete = async () => {
    setBulkDeleting(true)
    try {
      const response = await apiRequest<{ message: string; deletedCount: number }>("/api/v1/bulk-delete", {
        method: "POST",
        body: {
          resource: bulkDeleteResource,
          ids: selectedIds,
        },
      })
      toast.success(response.message)
      setSelectedIds([])
      mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to delete selected ${title.toLowerCase()}`)
    } finally {
      setBulkDeleting(false)
    }
  }

  const renderField = (field: Field) => {
    const value = formValues[field.name] ?? ""
    const commonProps = {
      value: String(value),
      onChange: (nextValue: string) => setFormValues((current) => ({ ...current, [field.name]: nextValue })),
    }

    if (field.type === "select") {
      return (
        <SelectField
          value={String(value)}
          onChange={commonProps.onChange}
          options={[{ label: "Select", value: "" }, ...getOptions(data, field)]}
        />
      )
    }

    if (field.type === "textarea") {
      return <Textarea value={String(value)} onChange={(event) => commonProps.onChange(event.target.value)} placeholder={field.placeholder} />
    }

    if (field.type === "image") {
      return (
        <LocalImageUpload
          label={field.label}
          hint="Upload JPG, PNG, or WEBP. Max 2MB."
          value={String(value)}
          onChange={commonProps.onChange}
        />
      )
    }

    return (
      <Input
        type={field.type ?? "text"}
        value={String(value)}
        onChange={(event) => commonProps.onChange(event.target.value)}
        placeholder={field.placeholder}
      />
    )
  }

  const visibleFields = fields.filter((field) => (editingRecord ? !field.hideOnEdit : !field.hideOnCreate))
  const fieldSections = visibleFields.reduce<Array<{ title: string; fields: Field[] }>>((sections, field) => {
    const title = field.section || "Details"
    const existing = sections.find((section) => section.title === title)
    if (existing) {
      existing.fields.push(field)
    } else {
      sections.push({ title, fields: [field] })
    }
    return sections
  }, [])

  return (
    <div className="space-y-5">
      <AccessPageHeader
        breadcrumb={breadcrumb}
        title={title}
        description={description}
        action={allowCreate ? (
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New {recordName}
          </Button>
        ) : undefined}
      />

      <AccessToolbar>
        <div className="flex flex-1 flex-col gap-3 xl:flex-row xl:items-center">
          <AccessSearchField
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
            placeholder={searchPlaceholder}
          />
          <div className="flex flex-wrap items-center gap-2">
            {statusOptions ? (
              <SelectField
                value={status}
                onChange={(value) => {
                  setStatus(value)
                  setPage(1)
                }}
                options={[{ label: "All statuses", value: "" }, ...statusOptions]}
                className="w-auto min-w-36"
              />
            ) : null}
            {typeOptions ? (
              <SelectField
                value={type}
                onChange={(value) => {
                  setType(value)
                  setPage(1)
                }}
                options={[{ label: "All types", value: "" }, ...typeOptions]}
                className="w-auto min-w-44"
              />
            ) : null}
            {methodOptions ? (
              <SelectField
                value={method}
                onChange={(value) => {
                  setMethod(value)
                  setPage(1)
                }}
                options={[{ label: methodFilterLabel, value: "" }, ...methodOptions]}
                className="w-auto min-w-44"
              />
            ) : null}
            {showDateFilters ? (
              <>
                <SelectField
                  value={period}
                  onChange={(value) => {
                    setPeriod(value)
                    setPage(1)
                  }}
                  options={[
                    { label: "All dates", value: "" },
                    { label: "Today", value: "today" },
                    { label: "Yesterday", value: "yesterday" },
                    { label: "This week", value: "week" },
                    { label: "This month", value: "month" },
                    { label: "This year", value: "year" },
                    { label: "Custom date", value: "custom" },
                  ]}
                  className="w-auto min-w-40"
                />
                {period === "custom" ? (
                  <Input
                    type="date"
                    value={customDate}
                    onChange={(event) => {
                      setCustomDate(event.target.value)
                      setPage(1)
                    }}
                    className="h-10 w-auto min-w-40"
                  />
                ) : null}
              </>
            ) : null}
            <span className="text-sm text-muted-foreground">Per page</span>
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
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {allowDelete && selectedIds.length > 0 ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" size="sm" className="gap-2" disabled={bulkDeleting}>
                  {bulkDeleting ? <Spinner /> : <Trash2 className="h-3.5 w-3.5" />}
                  Delete Selected ({selectedIds.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete selected records</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove {selectedIds.length} selected {selectedIds.length === 1 ? recordName : title.toLowerCase()} record{selectedIds.length === 1 ? "" : "s"}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={handleBulkDelete}>
                    Delete Selected
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
          <p className="text-sm text-muted-foreground">{pagination?.total ?? 0} records</p>
        </div>
      </AccessToolbar>

      <AccessCard title={`${title} Directory`} description={`Manage ${title.toLowerCase()} records.`}>
        <TableShell>
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/45 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <tr>
                {allowDelete ? (
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Select all ${title.toLowerCase()} on this page`}
                      checked={allVisibleSelected}
                      disabled={records.length === 0}
                      onChange={(event) => toggleAllVisible(event.target.checked)}
                      className="h-4 w-4 rounded border-border"
                    />
                  </th>
                ) : null}
                {columns.map((column) => (
                  <th key={column.key} className="px-4 py-3">{column.label}</th>
                ))}
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={String(record.id)} className="border-t border-border/70">
                  {allowDelete ? (
                    <td className="px-4 py-3 align-top">
                      <input
                        type="checkbox"
                        aria-label={`Select ${recordName} ${String(getValue(record, columns[0]?.key || "id") ?? record.id)}`}
                        checked={selectedIds.includes(String(record.id))}
                        onChange={(event) => toggleRecordSelection(String(record.id), event.target.checked)}
                        className="h-4 w-4 rounded border-border"
                      />
                    </td>
                  ) : null}
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 align-top">
                      {column.render ? column.render(record) : formatCell(getValue(record, column.key))}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <RowActions
                        label={`Actions for ${recordName}`}
                        actions={[
                          { label: "View", icon: defaultActionIcons.view, onClick: () => openDetails(record) },
                          ...(allowEdit ? [{ label: "Edit", icon: defaultActionIcons.edit, onClick: () => openEdit(record) }] : []),
                          ...(allowDelete ? [
                          {
                            label: "Delete",
                            icon: defaultActionIcons.delete,
                            destructive: true,
                            separatorBefore: true,
                            onClick: () => handleDelete(record),
                            confirm: {
                              title: `Delete ${recordName}`,
                              description: `This action permanently removes this ${recordName} record.`,
                            },
                          },
                          ] : []),
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && records.length === 0 ? (
            <div className="p-4">
              <TableEmpty title={`No ${title.toLowerCase()} found`} description="Create a record or adjust your filters." />
            </div>
          ) : null}
          {isLoading ? <TableSkeleton columns={columns.length + (allowDelete ? 2 : 1)} rows={5} /> : null}
          {pagination ? (
            <PaginationControls
              page={pagination.page}
              pages={pagination.pages}
              total={pagination.total}
              onPageChange={setPage}
            />
          ) : null}
        </TableShell>
      </AccessCard>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[96vw] max-w-[42rem] overflow-y-auto p-0">
          <SheetHeader className="border-b border-border/70 px-6 py-5">
            <SheetTitle>{editingRecord ? `Edit ${recordName}` : `Create ${recordName}`}</SheetTitle>
            <p className="text-sm text-muted-foreground">Fill in the module details and save changes.</p>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            {fieldSections.map((section) => (
              <AccessCard key={section.title} title={section.title} description={section.title === "Details" ? `Core ${recordName} information.` : undefined}>
                <div className="grid gap-4 md:grid-cols-2">
                  {section.fields.map((field) => (
                    <div key={field.name} className={field.className}>
                      {field.type === "image" ? renderField(field) : <FieldBlock label={field.label}>{renderField(field)}</FieldBlock>}
                    </div>
                  ))}
                </div>
              </AccessCard>
            ))}
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-5 py-4">
              <p className="text-sm text-muted-foreground">Changes are protected by the existing Access Control permissions.</p>
              <Button type="submit" className="gap-2" disabled={submitting}>
                {submitting ? <Spinner /> : null}
                {submitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent side="right" className="w-[96vw] max-w-[38rem] overflow-y-auto p-0">
          <SheetHeader className="border-b border-border/70 px-6 py-5">
            <SheetTitle>{title} Details</SheetTitle>
            <p className="text-sm text-muted-foreground">A quick read-only view of this record.</p>
          </SheetHeader>
          <div className="space-y-3 p-6">
            {loadingDetails ? <TableSkeleton columns={1} rows={3} /> : null}
            {supportsLoginDetails && loginAccount ? (
              <div className="rounded-xl border border-border/70 bg-card px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Login Details</p>
                    <div className="mt-3 grid gap-2 text-sm">
                      <p><span className="font-medium">Email:</span> {formatCell(loginAccount.loginEmail)}</p>
                      <p><span className="font-medium">Phone:</span> {formatCell(loginAccount.loginPhone)}</p>
                      <p><span className="font-medium">Username:</span> {formatCell(loginAccount.username)}</p>
                      <p><span className="font-medium">Account status:</span> {formatCell(loginAccount.accountStatus)}</p>
                      <p><span className="font-medium">Password change required:</span> {loginAccount.mustChangePassword ? "Yes" : "No"}</p>
                      <p>
                        <span className="font-medium">Temporary password:</span>{" "}
                        {showTemporaryPassword ? temporaryPassword || "Not available" : "Hidden"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={loadLoginDetails} disabled={loadingCredentials}>
                      {showTemporaryPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {loadingCredentials ? "Loading..." : showTemporaryPassword ? "Refresh" : "Show Password"}
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={copyLoginDetails}>
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={resendWelcomeEmail} disabled={loadingCredentials}>
                      <Mail className="h-3.5 w-3.5" />
                      Resend Email
                    </Button>
                    {recordName === "trainer" ? (
                      <>
                        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={resetTrainerPassword} disabled={loadingCredentials}>
                          <KeyRound className="h-3.5 w-3.5" />
                          Reset Password
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setTrainerAccountStatus(loginAccount.accountStatus === "SUSPENDED" ? "ACTIVE" : "SUSPENDED")} disabled={loadingCredentials}>
                          {loginAccount.accountStatus === "SUSPENDED" ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldX className="h-3.5 w-3.5" />}
                          {loginAccount.accountStatus === "SUSPENDED" ? "Unblock Login" : "Block Login"}
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
            {viewRecord
              ? detailsColumns.map((column) => (
                  <div key={column.key} className="rounded-xl border border-border/70 bg-card px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{column.label}</p>
                    <div className="mt-2 text-sm font-medium">
                      {column.render ? column.render(viewRecord) : formatCell(getValue(viewRecord, column.key))}
                    </div>
                  </div>
                ))
              : null}
            {viewRecord
              ? Object.entries(viewRecord)
                  .filter(([, value]) => Array.isArray(value))
                  .map(([key, value]) => (
                    <div key={key} className="rounded-xl border border-border/70 bg-card px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{humanLabel(key)}</p>
                      <p className="mt-2 text-sm font-medium">{relationTitle(key, (value as unknown[]).length)}</p>
                      <div className="mt-3 space-y-2">
                        {(value as RecordValue[]).slice(0, 5).map((entry, index) => (
                          <div key={String(entry.id ?? index)} className="rounded-lg border border-border/60 bg-muted/25 px-3 py-3 text-sm">
                            <div className="grid gap-2 sm:grid-cols-2">
                              {readablePairs(key, entry)
                                .filter((item) => item.value !== null && item.value !== undefined && item.value !== "")
                                .map((item) => (
                                  <div key={item.label}>
                                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{item.label}</p>
                                    <p className="mt-1 font-medium text-foreground">{formatCell(item.value)}</p>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                        {(value as unknown[]).length === 0 ? (
                          <p className="rounded-lg border border-dashed border-border/70 px-3 py-3 text-sm text-muted-foreground">No records yet.</p>
                        ) : null}
                      </div>
                    </div>
                  ))
              : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export function StatusPill({ value }: { value: string }) {
  return (
    <Pill variant="secondary" className="bg-primary/10 text-primary">
      {value.replaceAll("_", " ")}
    </Pill>
  )
}

export function currency(value: unknown) {
  const numberValue = Number(value ?? 0)
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(numberValue)
}

export function shortDate(value: unknown) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(String(value)))
}
