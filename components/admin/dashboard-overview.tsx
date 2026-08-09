import { PopularServicesMock } from "@/components/admin/popular-services-mock"
import { RecentActivityMock } from "@/components/admin/recent-activity-mock"
import { RevenueOverviewLazy } from "@/components/admin/revenue-overview-lazy"
import { StatsOverviewMock } from "@/components/admin/stats-overview-mock"

export function DashboardOverview() {
	return (
		<>
			<StatsOverviewMock />

			<div className="grid gap-6 lg:grid-cols-3">
				<RevenueOverviewLazy />
				<PopularServicesMock />
			</div>

			<RecentActivityMock />
		</>
	)
}
