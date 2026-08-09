import { Clock3, Rocket } from "lucide-react"

import { DemoChartCard } from "@/components/admin/demo-chart-card"
import { DemoFormCard } from "@/components/admin/demo-form-card"
import { DemoTableCard } from "@/components/admin/demo-table-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { demoTableRows, starterFormDefaults, usageChartData } from "@/lib/mock-data"
import type { NavItem } from "@/lib/navigation"

export function ComingSoonPage({ item }: { item: NavItem }) {
	return (
		<>
			<div className="mb-2">
				<h1 className="text-4xl font-bold text-foreground mb-2">{item.title}</h1>
				<p className="text-muted-foreground">{item.description}</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Clock3 className="w-5 h-5" />
						Coming Soon
					</CardTitle>
					<CardDescription>This section is intentionally left as a placeholder in the starter admin panel.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="rounded-lg border border-border p-4">
						<p className="text-sm font-medium">Status</p>
						<p className="text-sm text-muted-foreground mt-1">{item.status}</p>
					</div>

					<div className="rounded-lg border border-border p-4">
						<p className="text-sm font-medium flex items-center gap-2">
							<Rocket className="w-4 h-4 text-primary" />
							Suggested widgets
						</p>
						<ul className="mt-3 space-y-2 text-sm text-muted-foreground">
							{item.suggestedWidgets.map((widget) => (
								<li key={widget} className="rounded-md bg-muted/60 px-3 py-2">
									{widget}
								</li>
							))}
						</ul>
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-6 xl:grid-cols-2">
				<DemoChartCard
					title={`${item.title} Demo Chart`}
					description="Shared mock data chart block that can later connect to real reporting data."
					data={usageChartData}
					summaryLabel="Weekly mock usage"
				/>
				<DemoTableCard
					title={`${item.title} Demo Table`}
					description="Reusable mock table for module records, workflows, or customer data."
					rows={demoTableRows}
				/>
			</div>

			<DemoFormCard
				title={`${item.title} Demo Form`}
				description="Starter form powered by local demo state so you can later attach validation and API submission."
				initialValues={{
					...starterFormDefaults,
					defaultModule: item.href.replace("/", ""),
					notes: `Mock starter form for ${item.title}. Replace this with your real business form later.`,
				}}
			/>
		</>
	)
}
