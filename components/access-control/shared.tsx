import { Search } from "lucide-react"
import Link from "next/link"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function AccessPageHeader({
  breadcrumb,
  title,
  description,
  action,
}: {
  breadcrumb: string[]
  title: string
  description: string
  action?: React.ReactNode
}) {
  const getBreadcrumbHref = (item: string, index: number) => {
    if (index === 0) return "/dashboard"
    if (item === "Access Control") return "/access-control/settings"
    return "/dashboard"
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card px-5 py-5 shadow-[0_16px_32px_-28px_rgba(15,23,42,0.35)] sm:px-6">
      <Breadcrumb>
        <BreadcrumbList className="text-xs font-medium uppercase tracking-[0.22em]">
          {breadcrumb.map((item, index) => [
            index > 0 ? <BreadcrumbSeparator key={`separator-${item}-${index}`}>/</BreadcrumbSeparator> : null,
            <BreadcrumbItem key={`${item}-${index}`}>
              {index === breadcrumb.length - 1 ? (
                <BreadcrumbPage className="text-xs font-semibold uppercase tracking-[0.22em]">{item}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild className="text-xs font-medium uppercase tracking-[0.22em]">
                  <Link href={getBreadcrumbHref(item, index)}>{item}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>,
          ])}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            {title}
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  )
}

export function AccessToolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card px-4 py-4 shadow-[0_16px_32px_-30px_rgba(15,23,42,0.25)] sm:px-5 md:flex-row md:items-center md:justify-between">
      {children}
    </div>
  )
}

export function AccessSearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="relative w-full md:max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="pl-9" />
    </div>
  )
}

export function AccessCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={cn("rounded-2xl border border-border/70 bg-card shadow-[0_16px_32px_-30px_rgba(15,23,42,0.25)]", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-lg">{title}</CardTitle>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function FieldBlock({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="space-y-2">
      <div className="space-y-1">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </label>
  )
}

export function TableShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border/70 bg-card", className)}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

export function TableEmpty({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-border/80 bg-muted/35 px-6 py-10 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export function TableSkeleton({ columns = 6, rows = 5 }: { columns?: number; rows?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <Skeleton key={columnIndex} className="h-8 rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function PaginationControls({
  page,
  pages,
  total,
  onPageChange,
}: {
  page: number
  pages: number
  total: number
  onPageChange: (page: number) => void
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border/70 px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p>
        Page {page} of {pages} with {total} records
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  )
}

export function Pill({
  children,
  variant = "outline",
  className,
}: {
  children: React.ReactNode
  variant?: "default" | "secondary" | "outline"
  className?: string
}) {
  return (
    <Badge
      variant={variant}
      className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] uppercase", className)}
    >
      {children}
    </Badge>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export function SelectField({
  value,
  onChange,
  options,
  className,
}: {
  value: string
  onChange: (value: string) => void
  options: Array<{ label: string; value: string }>
  className?: string
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]",
        className,
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export function formatAuditDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}
