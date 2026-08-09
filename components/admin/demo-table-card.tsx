import { Database } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { DemoTableRow } from "@/lib/mock-data"

type DemoTableCardProps = {
	title: string
	description: string
	rows: DemoTableRow[]
}

const statusClasses: Record<DemoTableRow["status"], string> = {
	Live: "bg-primary/20 text-[var(--brand-navy)] dark:text-primary",
	Review: "bg-destructive/10 text-destructive",
	Draft: "bg-muted text-muted-foreground",
}

export function DemoTableCard({ title, description, rows }: DemoTableCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Database className="w-5 h-5" />
					{title}
				</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="overflow-hidden rounded-lg border border-border">
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead className="bg-muted/60">
								<tr>
									<th className="px-4 py-3 text-left font-medium">Module</th>
									<th className="px-4 py-3 text-left font-medium">Owner</th>
									<th className="px-4 py-3 text-left font-medium">Status</th>
									<th className="px-4 py-3 text-left font-medium">Value</th>
									<th className="px-4 py-3 text-left font-medium">Updated</th>
								</tr>
							</thead>
							<tbody>
								{rows.map((row) => (
									<tr key={row.id} className="border-t border-border">
										<td className="px-4 py-3">
											<div>
												<p className="font-medium">{row.name}</p>
												<p className="text-xs text-muted-foreground">{row.id}</p>
											</div>
										</td>
										<td className="px-4 py-3 text-muted-foreground">{row.owner}</td>
										<td className="px-4 py-3">
											<span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[row.status]}`}>
												{row.status}
											</span>
										</td>
										<td className="px-4 py-3 font-medium">{row.value}</td>
										<td className="px-4 py-3 text-muted-foreground">{row.updatedAt}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
