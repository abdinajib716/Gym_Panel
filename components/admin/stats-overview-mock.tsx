import { Calendar, CheckCircle2, DollarSign, TrendingUp, Users, XCircle } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { dashboardStatCards } from "@/lib/mock-data"

const statIcons = [Calendar, DollarSign, Users, TrendingUp, CheckCircle2, XCircle]

export function StatsOverviewMock() {
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{dashboardStatCards.map((stat, index) => {
				const Icon = statIcons[index]

				return (
					<Card key={stat.title}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
							<Icon className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stat.value}</div>
							<p className="text-xs text-muted-foreground">{stat.description}</p>
						</CardContent>
					</Card>
				)
			})}
		</div>
	)
}
