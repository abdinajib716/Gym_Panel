"use client"

import { useMemo, useState } from "react"
import { Copy, Eye, EyeOff, Mail, Pencil, Plus, Trash2 } from "lucide-react"
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
  type?: "text" | "email" | "number" | "date" | "datetime-local" | "textarea" | "select"
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
}: CrudPageProps) {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [type, setType] = useState("")
  const [method, setMethod] = useState("")
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

  const query = useMemo(() => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("limit", String(limit))
    if (search) params.set("search", search)
    if (status) params.set("status", status)
    if (type) params.set("type", type)
    if (method) params.set("method", method)
    return `${endpoint}?${params.toString()}`
  }, [endpoint, limit, method, page, search, status, type])

  const { data, mutate, isLoading } = useSWR<RecordValue>(query, fetcher)
  const records = (data?.[dataKey] as RecordValue[] | undefined) ?? []
  const pagination = data?.pagination as { page: number; pages: number; total: number } | undefined
  const detailsColumns = detailFields ?? columns

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
        action={
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New {recordName}
          </Button>
        }
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
                options={[{ label: "All methods", value: "" }, ...methodOptions]}
                className="w-auto min-w-44"
              />
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
        <p className="text-sm text-muted-foreground">{pagination?.total ?? 0} records</p>
      </AccessToolbar>

      <AccessCard title={`${title} Directory`} description={`Manage ${title.toLowerCase()} records.`}>
        <TableShell>
          <table className="min-w-full text-sm">
            <thead className="bg-muted/45 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className="px-4 py-3">{column.label}</th>
                ))}
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={String(record.id)} className="border-t border-border/70">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 align-top">
                      {column.render ? column.render(record) : formatCell(getValue(record, column.key))}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => openDetails(record)}>
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => openEdit(record)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="gap-2">
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {recordName}</AlertDialogTitle>
                            <AlertDialogDescription>This action permanently removes this {recordName} record.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => handleDelete(record)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
          {isLoading ? <TableSkeleton columns={columns.length + 1} rows={5} /> : null}
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
                      <FieldBlock label={field.label}>{renderField(field)}</FieldBlock>
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
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{key.replaceAll("_", " ")}</p>
                      <p className="mt-2 text-sm font-medium">{(value as unknown[]).length} related records</p>
                      <div className="mt-3 space-y-2">
                        {(value as RecordValue[]).slice(0, 5).map((entry, index) => (
                          <div key={String(entry.id ?? index)} className="rounded-lg border border-border/60 bg-muted/25 px-3 py-2 text-xs text-muted-foreground">
                            {Object.entries(entry)
                              .filter(([, entryValue]) => ["string", "number", "boolean"].includes(typeof entryValue))
                              .slice(0, 4)
                              .map(([entryKey, entryValue]) => (
                                <span key={entryKey} className="mr-3">
                                  <span className="font-medium text-foreground">{entryKey}:</span> {formatCell(entryValue)}
                                </span>
                              ))}
                          </div>
                        ))}
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
