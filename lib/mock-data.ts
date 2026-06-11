export type DemoChartPoint = {
	label: string
	value: number
}

export type DemoTableRow = {
	id: string
	name: string
	owner: string
	status: "Live" | "Review" | "Draft"
	value: string
	updatedAt: string
}

export type DemoFormValues = {
	workspaceName: string
	ownerEmail: string
	defaultModule: string
	alertThreshold: string
	notes: string
	enableNotifications: boolean
	autoAssignTasks: boolean
}

export type MockStatCard = {
	title: string
	value: string
	description: string
}

export type MockRevenuePoint = {
	month: string
	revenue: number
	bookings: number
}

export type MockActivity = {
	id: string
	name: string
	service: string
	date: string
	time: string
	status: "AWAITING PAYMENT" | "PENDING" | "CONFIRMED" | "ABANDONED"
}

export type MockPopularService = {
	id: string
	name: string
	bookings: number
	revenue: string
}

export const revenueChartData: DemoChartPoint[] = [
	{ label: "Jan", value: 18 },
	{ label: "Feb", value: 24 },
	{ label: "Mar", value: 21 },
	{ label: "Apr", value: 32 },
	{ label: "May", value: 28 },
	{ label: "Jun", value: 36 },
]

export const usageChartData: DemoChartPoint[] = [
	{ label: "Mon", value: 42 },
	{ label: "Tue", value: 58 },
	{ label: "Wed", value: 49 },
	{ label: "Thu", value: 64 },
	{ label: "Fri", value: 71 },
	{ label: "Sat", value: 53 },
	{ label: "Sun", value: 47 },
]

export const demoTableRows: DemoTableRow[] = [
	{
		id: "MOD-1001",
		name: "Customer Portal",
		owner: "Amina",
		status: "Live",
		value: "$12,400",
		updatedAt: "2 hours ago",
	},
	{
		id: "MOD-1002",
		name: "Operations Board",
		owner: "Kevin",
		status: "Review",
		value: "$8,920",
		updatedAt: "Today",
	},
	{
		id: "MOD-1003",
		name: "Billing Engine",
		owner: "Sophia",
		status: "Draft",
		value: "$4,180",
		updatedAt: "Yesterday",
	},
	{
		id: "MOD-1004",
		name: "Growth Dashboard",
		owner: "Daniel",
		status: "Live",
		value: "$15,360",
		updatedAt: "3 days ago",
	},
]

export const starterFormDefaults: DemoFormValues = {
	workspaceName: "Startap HQ",
	ownerEmail: "owner@startap.dev",
	defaultModule: "dashboard",
	alertThreshold: "80",
	notes: "This is demo mock data. Replace it later with a real settings API or form store.",
	enableNotifications: true,
	autoAssignTasks: false,
}

export const starterTaskList = [
	"Connect the mock form to your real settings endpoint.",
	"Replace the mock rows with API-driven datasets.",
	"Swap the chart series with analytics or reporting data.",
]

export const dashboardStatCards: MockStatCard[] = [
	{
		title: "Today's Bookings",
		value: "14",
		description: "Appointments scheduled today",
	},
	{
		title: "Monthly Revenue",
		value: "$18,420",
		description: "42 paid bookings this month",
	},
	{
		title: "Total Bookings",
		value: "186",
		description: "All time bookings",
	},
	{
		title: "Pending",
		value: "9",
		description: "Awaiting confirmation",
	},
	{
		title: "Completed",
		value: "128",
		description: "Finished appointments",
	},
	{
		title: "Cancelled",
		value: "7",
		description: "Cancelled appointments",
	},
]

export const revenueOverviewData: MockRevenuePoint[] = [
	{ month: "November 2025", revenue: 4200, bookings: 11 },
	{ month: "December 2025", revenue: 5100, bookings: 13 },
	{ month: "January 2026", revenue: 6800, bookings: 17 },
	{ month: "February 2026", revenue: 7400, bookings: 19 },
	{ month: "March 2026", revenue: 9200, bookings: 24 },
	{ month: "April 2026", revenue: 8400, bookings: 21 },
]

export const recentActivities: MockActivity[] = [
	{
		id: "ACT-01",
		name: "Hilowle",
		service: "Hair Wash & Haircut",
		date: "3/24/2026",
		time: "8:30 AM",
		status: "AWAITING PAYMENT",
	},
	{
		id: "ACT-02",
		name: "Hilowle",
		service: "Beard trim (Gar)",
		date: "3/18/2026",
		time: "8:30 AM",
		status: "ABANDONED",
	},
	{
		id: "ACT-03",
		name: "karshe Poi",
		service: "Hair Wash & Haircut",
		date: "3/15/2026",
		time: "8:30 AM",
		status: "PENDING",
	},
	{
		id: "ACT-04",
		name: "Abdinajib Mohamed Karshe",
		service: "Hair Wash & Haircut",
		date: "3/12/2026",
		time: "10:00 AM",
		status: "CONFIRMED",
	},
	{
		id: "ACT-05",
		name: "Abdinajib Mohamed Karshe",
		service: "Hair Wash & Haircut",
		date: "3/7/2026",
		time: "11:30 AM",
		status: "CONFIRMED",
	},
	{
		id: "ACT-06",
		name: "Super Admin",
		service: "Kid's Haircut",
		date: "3/9/2026",
		time: "11:30 AM",
		status: "CONFIRMED",
	},
	{
		id: "ACT-07",
		name: "Super Admin",
		service: "Hair Wash & Haircut",
		date: "3/5/2026",
		time: "10:00 AM",
		status: "PENDING",
	},
	{
		id: "ACT-08",
		name: "Super Admin",
		service: "Hair Wash & Haircut",
		date: "3/5/2026",
		time: "10:00 AM",
		status: "PENDING",
	},
]

export const popularServices: MockPopularService[] = [
	{
		id: "SRV-01",
		name: "Hair Wash & Haircut",
		bookings: 3,
		revenue: "$120",
	},
	{
		id: "SRV-02",
		name: "Kid's Haircut",
		bookings: 2,
		revenue: "$84",
	},
	{
		id: "SRV-03",
		name: "Beard Trim",
		bookings: 2,
		revenue: "$48",
	},
]
