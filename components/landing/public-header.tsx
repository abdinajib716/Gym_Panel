import Link from "next/link"

import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"

const links = [
  ["Home", "#home"],
  ["Store", "/shop"],
  ["About us", "#about"],
  ["Our team", "#team"],
  ["Testimonials", "#testimonials"],
  ["Contact us", "#contact"],
] as const

export function PublicHeader({ page = "home" }: { page?: "home" | "shop" }) {
  const hrefFor = (href: string) => page === "shop" && href.startsWith("#") ? `/${href}` : href

  return <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/95 backdrop-blur"><div className="container flex h-[71px] items-center gap-4"><Logo href="/" className="shrink-0" /><nav className="hidden min-w-0 flex-1 lg:block"><ul className="flex items-center justify-center gap-1 xl:gap-2">{links.map(([label, href]) => <li key={label}><Link className="inline-flex h-9 items-center whitespace-nowrap rounded-lg px-2.5 text-sm font-medium transition-colors hover:bg-[var(--brand-navy-soft)] hover:text-[var(--brand-navy)] xl:px-3" href={hrefFor(href)}>{label}</Link></li>)}</ul></nav><div className="ml-auto flex items-center gap-2"><ThemeToggle /><Button asChild className="shrink-0"><Link href="/signin">Login</Link></Button></div></div></header>
}
