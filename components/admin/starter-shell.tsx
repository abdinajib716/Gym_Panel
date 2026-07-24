"use client"

import { useAccessSettings } from "@/lib/swr"
import { cn } from "@/lib/utils"

export function StarterShell({ children }: { children: React.ReactNode }) {
	const { data } = useAccessSettings()
	const fullWidth = data?.settings?.layoutWidth === "full"

	return (
		<div className={cn("mx-auto w-full space-y-5", fullWidth ? "max-w-none" : "max-w-7xl")}>
			{children}
		</div>
	)
}
