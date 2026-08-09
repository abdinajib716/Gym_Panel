"use client"

import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
	Label,
} from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { revenueOverviewData } from "@/lib/mock-data"

export function RevenueOverviewMock() {
	const revenueColor = "var(--brand-navy)"
	const bookingsColor = "var(--primary)"
	const gridColor = "var(--border)"

	return (
		<Card className="lg:col-span-2">
			<CardHeader>
				<CardTitle>Revenue Overview</CardTitle>
				<CardDescription>
					Monthly revenue and booking trends for the last 6 months
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="w-full h-[350px]">
					<ResponsiveContainer width="100%" height="100%">
						<BarChart
							data={revenueOverviewData}
							barCategoryGap={18}
							margin={{ top: 24, right: 24, left: 10, bottom: 36 }}
						>
							<CartesianGrid strokeDasharray="6 4" stroke={gridColor} vertical={false} />
							<XAxis
								dataKey="month"
								tick={{ fontSize: 12, fill: "var(--muted-foreground)", fontFamily: "inherit" }}
								axisLine={false}
								tickLine={false}
								padding={{ left: 8, right: 8 }}
							/>
							<YAxis
								yAxisId="left"
								tick={{ fontSize: 13, fill: "var(--muted-foreground)", fontFamily: "inherit" }}
								axisLine={false}
								tickLine={false}
								width={60}
								label={
									<Label
										value="Revenue"
										angle={-90}
										position="left"
										offset={-14}
										style={{
											textAnchor: "middle",
											fill: revenueColor,
											fontSize: 13,
											fontWeight: 500,
											fontFamily: "inherit",
										}}
									/>
								}
							/>
							<YAxis
								yAxisId="right"
								orientation="right"
								tick={{ fontSize: 13, fill: bookingsColor, fontFamily: "inherit" }}
								axisLine={false}
								tickLine={false}
								width={40}
								label={
									<Label
										value="Bookings"
										angle={90}
										position="right"
										offset={-15}
										style={{
											textAnchor: "middle",
											fill: bookingsColor,
											fontSize: 13,
											fontWeight: 500,
											fontFamily: "inherit",
										}}
									/>
								}
							/>
							<Tooltip
								contentStyle={{
									background: "var(--popover)",
									border: `1px solid ${gridColor}`,
									borderRadius: "12px",
									boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
								}}
								labelStyle={{
									color: revenueColor,
									fontWeight: 600,
									fontFamily: "inherit",
									fontSize: "15px",
								}}
								formatter={(value, name) => {
									if (name === "revenue") {
										return [`$${Number(value).toLocaleString()}`, "Revenue"]
									}
									if (name === "bookings") {
										return [value, "Bookings"]
									}
									return value
								}}
								cursor={{ fill: "var(--brand-navy-soft)" }}
							/>
							<Legend
								iconType="circle"
								align="right"
								verticalAlign="top"
								height={40}
								wrapperStyle={{
									marginBottom: 8,
									paddingRight: 12,
									fontFamily: "inherit",
									fontWeight: 500,
									fontSize: 13,
								}}
							/>
							<Bar
								yAxisId="left"
								dataKey="revenue"
								fill={revenueColor}
								name="Revenue"
								radius={[6, 6, 0, 0]}
								barSize={26}
							/>
							<Bar
								yAxisId="right"
								dataKey="bookings"
								fill={bookingsColor}
								name="Bookings"
								radius={[6, 6, 0, 0]}
								barSize={18}
							/>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	)
}
