import { TrendingUp } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { DemoChartPoint } from "@/lib/mock-data"

type DemoChartCardProps = {
	title: string
	description: string
	data: DemoChartPoint[]
	summaryLabel?: string
}

export function DemoChartCard({
	title,
	description,
	data,
	summaryLabel = "Trend",
}: DemoChartCardProps) {
	const maxValue = Math.max(...data.map((point) => point.value))
	const total = data.reduce((sum, point) => sum + point.value, 0)

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<TrendingUp className="w-5 h-5" />
					{title}
				</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="rounded-lg border border-border p-4">
					<div className="flex items-end justify-between">
						<div>
							<p className="text-sm font-medium">{summaryLabel}</p>
							<p className="text-2xl font-bold">{total}</p>
						</div>
						<p className="text-xs text-muted-foreground">Mock chart data</p>
					</div>
				</div>

				<div className="rounded-lg border border-border p-4">
					<div className="flex h-48 items-end gap-3">
						{data.map((point) => {
							const height = `${Math.max((point.value / maxValue) * 100, 10)}%`

							return (
								<div key={point.label} className="flex flex-1 flex-col items-center gap-2">
									<div className="flex h-36 w-full items-end">
										<div
											className="w-full rounded-t-md bg-primary/80 transition-all"
											style={{ height }}
											aria-label={`${point.label}: ${point.value}`}
										/>
									</div>
									<div className="text-center">
										<p className="text-xs font-medium">{point.label}</p>
										<p className="text-[11px] text-muted-foreground">{point.value}</p>
									</div>
								</div>
							)
						})}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
