"use client"

import { useEffect, useRef, useState } from "react"
import { LoaderCircle, Search, X } from "lucide-react"
import { useRouter } from "next/navigation"

type SearchResult = { id: string; title: string; subtitle: string; type: string; href: string }

const navigationResults: SearchResult[] = [
  { id: "dashboard", title: "Dashboard", subtitle: "Gym performance overview", type: "Page", href: "/dashboard" },
  { id: "members", title: "Members", subtitle: "Member directory and profiles", type: "Page", href: "/members" },
  { id: "membership-plans", title: "Membership Plans", subtitle: "Plan pricing and duration", type: "Page", href: "/membership-plans" },
  { id: "subscriptions", title: "Subscriptions", subtitle: "Member subscriptions", type: "Page", href: "/subscriptions" },
  { id: "payments", title: "Payments", subtitle: "Membership payment records", type: "Page", href: "/payments" },
  { id: "attendance", title: "Attendance", subtitle: "Member check-ins", type: "Page", href: "/attendance" },
  { id: "notifications", title: "Notifications", subtitle: "Announcements and reminders", type: "Page", href: "/notifications" },
  { id: "reports", title: "Reports", subtitle: "Operational reports", type: "Page", href: "/reports" },
  { id: "trainers", title: "Trainers", subtitle: "Trainer profiles", type: "Page", href: "/trainers" },
  { id: "store-products", title: "Store Products", subtitle: "Products and stock", type: "Page", href: "/store/products" },
  { id: "store-orders", title: "Store Orders", subtitle: "Store order management", type: "Page", href: "/store/orders" },
  { id: "website-content", title: "Landing Content", subtitle: "Public website content", type: "Page", href: "/access-control/landing" },
  { id: "contact-inbox", title: "Contact Inbox", subtitle: "Website contact messages", type: "Page", href: "/access-control/landing/inbox" },
  { id: "settings", title: "Settings", subtitle: "System and email configuration", type: "Page", href: "/access-control/settings" },
]

export function GlobalSearch() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const navigationMatches = query.trim().length < 2 ? [] : navigationResults.filter((result) => `${result.title} ${result.subtitle}`.toLowerCase().includes(query.trim().toLowerCase()))
  const allResults = [...navigationMatches, ...results]

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen(true) }
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    if (!open) return
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }, [open])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) { setResults([]); setLoading(false); return }
    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/v1/search?query=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        if (!response.ok) throw new Error("Search failed")
        const body = await response.json() as { results?: SearchResult[] }
        setResults(body.results ?? [])
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setResults([])
      } finally { setLoading(false) }
    }, 220)
    return () => { controller.abort(); window.clearTimeout(timeout) }
  }, [query, open])

  const choose = (href: string) => { setOpen(false); router.push(href) }

  return <><button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"><Search className="size-4" /><span className="hidden md:inline">Search...</span><kbd className="hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground md:inline-flex"><span className="text-xs">Ctrl</span>K</kbd></button>{open ? <div className="fixed inset-0 z-[100] flex items-start justify-center bg-foreground/10 p-4 pt-[12vh]" onMouseDown={() => setOpen(false)}><section role="dialog" aria-modal="true" aria-label="Search gym data" className="w-full max-w-xl overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-center gap-3 border-b px-4"><Search className="size-5 text-muted-foreground" /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pages, members, trainers, products, or plans..." className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" /><button type="button" onClick={() => setOpen(false)} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close search"><X className="size-4" /></button></div><div className="max-h-[55vh] overflow-y-auto p-2">{query.trim().length < 2 ? <p className="px-3 py-8 text-center text-sm text-muted-foreground">Type at least two characters to search pages and gym records.</p> : allResults.length ? <>{allResults.map((result) => <button type="button" key={`${result.type}-${result.id}`} onClick={() => choose(result.href)} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-accent"><span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">{result.type}</span><span className="min-w-0"><span className="block truncate text-sm font-medium">{result.title}</span><span className="block truncate text-xs text-muted-foreground">{result.subtitle}</span></span></button>)}{loading ? <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground"><LoaderCircle className="size-3.5 animate-spin" />Searching records...</div> : null}</> : loading ? <div className="flex items-center gap-2 px-3 py-8 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Searching...</div> : <p className="px-3 py-8 text-center text-sm text-muted-foreground">No matching pages or records found.</p>}</div></section></div> : null}</>
}
