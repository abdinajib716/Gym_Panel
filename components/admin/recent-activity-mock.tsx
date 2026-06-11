import { Calendar, Clock } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { recentActivities } from "@/lib/mock-data"

function getStatusVariant(status: string) {
	switch (status) {
		case "CONFIRMED":
			return "default"
		case "PENDING":
			return "secondary"
		case "ABANDONED":
			return "destructive"
		default:
			return "outline"
	}
}

function getInitials(name: string) {
	return name
		.split(" ")
		.map((part) => part[0])
		.join("")
		.toUpperCase()
		.slice(0, 2)
}

export function RecentActivityMock() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Recent Activity</CardTitle>
				<CardDescription>Latest bookings and updates</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{recentActivities.map((activity) => (
						<div
							key={activity.id}
							className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
						>
							<Avatar className="w-10 h-10">
								<AvatarFallback className="bg-primary/10 text-primary font-semibold">
									{getInitials(activity.name)}
								</AvatarFallback>
							</Avatar>
							<div className="flex-1 min-w-0">
								<div className="flex items-start justify-between gap-2 mb-1">
									<p className="font-medium text-sm truncate">{activity.name}</p>
									<Badge variant={getStatusVariant(activity.status)} className="text-[10px]">
										{activity.status}
									</Badge>
								</div>
								<p className="text-sm text-muted-foreground mb-2">{activity.service}</p>
								<div className="flex items-center gap-3 text-xs text-muted-foreground">
									<div className="flex items-center gap-1">
										<Calendar className="w-3 h-3" />
										{activity.date}
									</div>
									<div className="flex items-center gap-1">
										<Clock className="w-3 h-3" />
										{activity.time}
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}
