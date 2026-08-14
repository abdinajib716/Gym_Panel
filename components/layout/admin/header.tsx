"use client"

import Link from "next/link"
import { Bell, CalendarDays, LogOut, Settings, User } from "lucide-react"
import { signOut, useSession } from "next-auth/react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GlobalSearch } from "@/components/ui/global-search"
import { Logo } from "@/components/ui/logo"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { getRoleLabel } from "@/lib/rbac"
import { useAccessSettings } from "@/lib/swr"
import { cn } from "@/lib/utils"

export default function Header() {
	const { data: session } = useSession()
	const { data: settingsData } = useAccessSettings()
	const fullWidth = settingsData?.settings?.layoutWidth === "full"
	const userName = session?.user?.name || "Super Admin"
	const userEmail = session?.user?.email || "admin@example.com"
	const userRole = session?.user?.role || "SUPER_ADMIN"
	const userInitials = userName
		.split(" ")
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase()
	const currentDate = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(new Date())

	return (
		<header className="gym-header sticky top-0 z-50 border-b border-sidebar-border bg-background/95 backdrop-blur">
			<SidebarTrigger className="absolute left-2 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-lg border-[var(--brand-navy)] bg-[var(--brand-navy)] text-white shadow-sm hover:bg-[var(--brand-navy)]/90" />
			<div className={cn("px-4 sm:px-6 lg:px-8", fullWidth ? "max-w-none" : "page-container")}>
				<div className="flex h-16 items-center justify-between gap-4">
					<div className="flex min-w-0 items-center gap-3">
						<Logo href="/dashboard" variant="compact" className="ml-10 md:hidden" />
					</div>

					<div className="flex items-center gap-1.5 sm:gap-2">
						<div className="hidden items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-2 text-xs font-medium text-muted-foreground lg:flex">
							<CalendarDays className="size-3.5 text-primary" />
							{currentDate}
						</div>
						<GlobalSearch />
						<Button asChild variant="ghost" size="icon" className="relative" aria-label="Notifications">
							<Link href="/notifications">
								<Bell className="size-4" />
								<span className="sr-only">Notifications</span>
							</Link>
						</Button>
						<ThemeToggle />

						<div className="hidden items-center border-l border-border pl-3 md:flex">
							<span className="text-xs font-medium text-muted-foreground">{getRoleLabel(userRole)}</span>
						</div>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" className="relative flex h-9 w-9 rounded-full transition-colors">
									<Avatar className="h-9 w-9 ring-1 ring-border transition-all">
										<AvatarImage src={session?.user?.image ?? undefined} alt={userName} />
										<AvatarFallback className="bg-primary/10 text-primary font-semibold">
											{userInitials}
										</AvatarFallback>
									</Avatar>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-64">
								<DropdownMenuLabel className="p-4">
									<div className="flex items-center gap-3">
										<Avatar className="h-12 w-12">
											<AvatarImage src={session?.user?.image ?? undefined} alt={userName} />
											<AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
												{userInitials}
											</AvatarFallback>
										</Avatar>
										<div className="flex flex-col space-y-0.5 flex-1 min-w-0">
											<p className="text-sm font-semibold truncate">{userName}</p>
											<p className="text-xs text-muted-foreground truncate">{userEmail}</p>
											<div className="flex items-center gap-1.5 mt-1">
												<div className="w-1.5 h-1.5 bg-primary rounded-full" />
												<p className="text-xs text-primary font-medium">{getRoleLabel(userRole)}</p>
											</div>
										</div>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem asChild className="py-2.5">
									<Link href="/profile">
										<User className="mr-2 h-4 w-4" />
										<span>Profile</span>
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild className="py-2.5">
									<Link href="/access-control/settings">
										<Settings className="mr-2 h-4 w-4" />
										<span>Settings</span>
									</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem className="py-2.5 text-destructive focus:text-destructive" onClick={() => signOut({ callbackUrl: "/signin" })}>
									<LogOut className="mr-2 h-4 w-4" />
									<span>Sign out</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</div>
		</header>
	)
}
