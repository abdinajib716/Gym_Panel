import Header from "./header"
import { AdminSidebar } from "./admin-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<AdminSidebar />
			<SidebarInset className="gym-shell bg-muted/40">
				<Header />
				<div className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
					<div className="page-container">{children}</div>
				</div>
				<footer className="border-t border-border/70 bg-background px-4 py-4 sm:px-6 lg:px-8">
					<div className="page-container flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
						<span>Gym management workspace</span>
						<span>Protected admin area</span>
					</div>
				</footer>
			</SidebarInset>
		</SidebarProvider>
	)
}
