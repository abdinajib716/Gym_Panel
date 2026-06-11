"use client"

import Link from "next/link"
import { Home, LogOut, Menu, Settings, User } from "lucide-react"
import { signOut, useSession } from "next-auth/react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

	return (
		<header className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/95">
			<div className={cn("mx-auto px-4 sm:px-6 lg:px-8", fullWidth ? "max-w-none" : "max-w-7xl")}>
				<div className="flex items-center justify-between h-16">
					<Logo href="/dashboard" variant="default" />

					<div className="flex items-center gap-3">
						<GlobalSearch />
						<ThemeToggle />
						<Button
							variant="ghost"
							size="icon"
							className="lg:hidden h-9 w-9"
							onClick={() => window.dispatchEvent(new Event("open-mobile-nav"))}
							aria-label="Open navigation menu"
						>
							<Menu className="w-4 h-4" />
						</Button>
						<Link href="/dashboard" className="hidden md:flex">
							<Button variant="ghost" size="sm" className="gap-2">
								<Home className="w-4 h-4" />
								Home
							</Button>
						</Link>

						<div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
							<div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
							<span className="text-xs font-medium text-primary">{getRoleLabel(userRole)}</span>
						</div>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" className="relative hidden md:flex h-10 w-10 rounded-full hover:bg-primary transition-colors">
									<Avatar className="h-10 w-10 ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
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
								<DropdownMenuItem className="py-2.5">
									<User className="mr-2 h-4 w-4" />
									<span>Profile</span>
								</DropdownMenuItem>
								<DropdownMenuItem className="py-2.5">
									<Settings className="mr-2 h-4 w-4" />
									<span>Settings</span>
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
