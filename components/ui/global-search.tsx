"use client"

import { Search } from "lucide-react"

export function GlobalSearch() {
	return (
		<button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background transition-colors text-sm text-muted-foreground hover:text-foreground">
			<Search className="w-4 h-4" />
			<span className="hidden md:inline">Search...</span>
			<kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
				<span className="text-xs">Ctrl</span>K
			</kbd>
		</button>
	)
}
