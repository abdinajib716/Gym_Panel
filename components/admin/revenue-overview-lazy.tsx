"use client"

import dynamic from "next/dynamic"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const RevenueOverviewMock = dynamic(
	() => import("@/components/admin/revenue-overview-mock").then((mod) => mod.RevenueOverviewMock),
	{
		ssr: false,
		loading: () => (
			<Card className="lg:col-span-2">
				<CardHeader>
					<CardTitle>Revenue Overview</CardTitle>
					<CardDescription>Monthly revenue and booking trends for the last 6 months</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="h-[350px] rounded-lg bg-muted/50 animate-pulse" />
				</CardContent>
			</Card>
		),
	},
)

export function RevenueOverviewLazy() {
	return <RevenueOverviewMock />
}
