import Header from "./header"
import { AdminSidebar } from "./admin-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<AdminSidebar />
			<SidebarInset className="bg-background">
				<Header />
				<div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	)
}
