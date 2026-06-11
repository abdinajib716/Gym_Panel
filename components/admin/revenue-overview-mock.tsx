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
	const revenueColor = "#6366f1"
	const bookingsColor = "#fbbf24"
	const gridColor = "#e5e7eb"

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
								tick={{ fontSize: 12, fill: "#64748b", fontFamily: "inherit" }}
								axisLine={false}
								tickLine={false}
								padding={{ left: 8, right: 8 }}
							/>
							<YAxis
								yAxisId="left"
								tick={{ fontSize: 13, fill: "#94a3b8", fontFamily: "inherit" }}
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
									background: "#fff",
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
								cursor={{ fill: "rgba(99,102,241,0.07)" }}
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
