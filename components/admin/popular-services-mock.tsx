import { DollarSign, TrendingUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { popularServices } from "@/lib/mock-data"

export function PopularServicesMock() {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<TrendingUp className="w-5 h-5" />
					Popular Services
				</CardTitle>
				<CardDescription>Top most booked starter services</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{popularServices.map((service, index) => (
						<div key={service.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
							<div className="flex items-center gap-3">
								<Badge variant="outline" className="w-8 h-8 flex items-center justify-center rounded-full">
									{index + 1}
								</Badge>
								<div>
									<p className="font-medium">{service.name}</p>
									<p className="text-sm text-muted-foreground">{service.bookings} bookings</p>
								</div>
							</div>
							<div className="text-right">
								<div className="flex items-center gap-1 font-semibold">
									<DollarSign className="w-4 h-4" />
									{service.revenue.replace("$", "")}
								</div>
								<p className="text-xs text-muted-foreground">total revenue</p>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}
