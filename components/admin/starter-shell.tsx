"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Search } from "lucide-react"
import { useEffect, useState } from "react"

import { Input } from "@/components/ui/input"
import { Logo } from "@/components/ui/logo"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useAccessSettings } from "@/lib/swr"
import { isGroupPath, sidebarNav, type NavItem } from "@/lib/navigation"
import { cn } from "@/lib/utils"

export function StarterShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname()
	const { data } = useAccessSettings()
	const [open, setOpen] = useState(false)
	const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
	const fullWidth = data?.settings?.layoutWidth === "full"

	useEffect(() => {
		setOpenGroups((current) => {
			const next = { ...current }
			for (const entry of sidebarNav) {
				if ("children" in entry && isGroupPath(entry, pathname)) {
					next[entry.title] = true
				}
			}
			return next
		})
	}, [pathname])

	useEffect(() => {
		const handleOpen = () => setOpen(true)
		window.addEventListener("open-mobile-nav", handleOpen)
		return () => window.removeEventListener("open-mobile-nav", handleOpen)
	}, [])

	const renderLink = (item: NavItem, compact = false) => {
		const Icon = item.icon
		const isActive = pathname === item.href

		return (
			<Link
				key={item.href}
				href={item.href}
				onClick={() => setOpen(false)}
				className={cn(
					"group flex items-center justify-between gap-3 transition-all",
					compact ? "rounded-lg px-3 py-2.5" : "rounded-lg px-3 py-2.5",
					isActive
						? "text-[#2f8fe8]"
						: "text-foreground/80 hover:bg-muted/55",
				)}
			>
				<div className="flex min-w-0 items-center gap-3">
					<span
						className={cn(
							"flex shrink-0 items-center justify-center rounded-full transition-colors",
							isActive ? "h-7 w-7 bg-muted text-[#2f8fe8]" : "h-7 w-7 bg-muted text-[#2f8fe8]",
						)}
					>
						<Icon className="h-3.5 w-3.5" />
					</span>
					<span className={cn("truncate text-sm", isActive ? "font-semibold" : "font-medium")}>{item.title}</span>
				</div>
			</Link>
		)
	}

	const navContent = (
		<nav className="flex-1 space-y-2 px-4 py-4">
			{sidebarNav.map((entry) => {
				if ("children" in entry) {
					const groupActive = isGroupPath(entry, pathname)
					const isOpen = openGroups[entry.title] ?? groupActive

					return (
						<div key={entry.title}>
							<button
								type="button"
							onClick={() => setOpenGroups((current) => ({ ...current, [entry.title]: !isOpen }))}
							className={cn(
								"group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
								groupActive
									? "text-[#2f8fe8]"
									: "text-foreground/80 hover:bg-muted/55",
							)}
							aria-expanded={isOpen}
							>
								<div className="flex min-w-0 items-center gap-3">
									<span
										className={cn(
											"flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
											groupActive ? "bg-muted text-[#2f8fe8]" : "bg-muted text-[#2f8fe8]",
										)}
									>
										<entry.icon className="h-4 w-4" />
									</span>
									<p className={cn("truncate text-sm", groupActive ? "font-semibold" : "font-medium")}>{entry.title}</p>
								</div>
								<ChevronRight
									className={cn(
										"h-4 w-4 shrink-0 transition-transform",
										groupActive ? "text-[#2f8fe8]" : "text-muted-foreground",
										isOpen ? "rotate-90" : "rotate-0",
									)}
								/>
							</button>

							{isOpen ? (
								<div className="mt-1 space-y-1.5">
									{entry.children.map((item) => (
										<div key={item.href} className="pl-3">
											{renderLink(item, true)}
										</div>
									))}
								</div>
							) : null}
						</div>
					)
				}

				return renderLink(entry)
			})}
		</nav>
	)

	return (
		<div className={cn("flex h-full mx-auto flex-col px-4 py-4 sm:px-6 sm:py-6 lg:flex-row lg:px-8 lg:py-8 gap-4 lg:gap-6", fullWidth ? "max-w-none" : "max-w-7xl")}>
			<div className="lg:hidden">
				<Sheet open={open} onOpenChange={setOpen}>
					<SheetContent side="left" className="w-[86vw] max-w-[19rem] p-0">
						<SheetHeader className="border-b border-border px-4 py-4 text-left">
							<SheetTitle className="sr-only">Navigation Menu</SheetTitle>
							<Logo href="/dashboard" variant="default" />
						</SheetHeader>
						<div className="flex min-h-0 flex-1 flex-col">
							<div className="px-4 pt-4">
								<div className="relative">
									<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
									<Input className="pl-9" placeholder="Search..." />
								</div>
							</div>
							{navContent}
						</div>
					</SheetContent>
				</Sheet>
			</div>

			<aside className="hidden lg:flex w-[17.5rem] shrink-0 flex-col overflow-hidden rounded-[1.75rem] border border-border/60 bg-card shadow-[0_20px_40px_-34px_rgba(15,23,42,0.45)]">
				{navContent}
			</aside>

			<main className="min-w-0 flex-1 space-y-5">{children}</main>
		</div>
	)
}
