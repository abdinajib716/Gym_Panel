"use client"

import { useState } from "react"
import { FileText, RotateCcw, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { DemoFormValues } from "@/lib/mock-data"

type DemoFormCardProps = {
	title: string
	description: string
	initialValues: DemoFormValues
}

export function DemoFormCard({ title, description, initialValues }: DemoFormCardProps) {
	const [values, setValues] = useState(initialValues)
	const [saved, setSaved] = useState(false)

	const updateValue = <K extends keyof DemoFormValues>(key: K, value: DemoFormValues[K]) => {
		setSaved(false)
		setValues((current) => ({ ...current, [key]: value }))
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<FileText className="w-5 h-5" />
					{title}
				</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-5">
				<form
					className="space-y-4"
					onSubmit={(event) => {
						event.preventDefault()
						setSaved(true)
					}}
				>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<label className="text-sm font-medium">Workspace name</label>
							<Input
								value={values.workspaceName}
								onChange={(event) => updateValue("workspaceName", event.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium">Owner email</label>
							<Input
								type="email"
								value={values.ownerEmail}
								onChange={(event) => updateValue("ownerEmail", event.target.value)}
							/>
						</div>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<label className="text-sm font-medium">Default module</label>
							<select
								className="border-input dark:bg-input/30 h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
								value={values.defaultModule}
								onChange={(event) => updateValue("defaultModule", event.target.value)}
							>
								<option value="dashboard">Dashboard</option>
								<option value="item-1">Item 1</option>
								<option value="item-2">Item 2</option>
								<option value="item-3">Item 3</option>
							</select>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium">Alert threshold</label>
							<Input
								value={values.alertThreshold}
								onChange={(event) => updateValue("alertThreshold", event.target.value)}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">Notes</label>
						<Textarea
							value={values.notes}
							onChange={(event) => updateValue("notes", event.target.value)}
						/>
					</div>

					<div className="grid gap-3 md:grid-cols-2">
						<label className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm">
							<input
								type="checkbox"
								checked={values.enableNotifications}
								onChange={(event) => updateValue("enableNotifications", event.target.checked)}
							/>
							Enable notifications
						</label>
						<label className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm">
							<input
								type="checkbox"
								checked={values.autoAssignTasks}
								onChange={(event) => updateValue("autoAssignTasks", event.target.checked)}
							/>
							Auto-assign tasks
						</label>
					</div>

					<div className="flex flex-wrap gap-3">
						<Button type="submit" className="gap-2">
							<Save className="w-4 h-4" />
							Save Demo Config
						</Button>
						<Button
							type="button"
							variant="outline"
							className="gap-2"
							onClick={() => {
								setValues(initialValues)
								setSaved(false)
							}}
						>
							<RotateCcw className="w-4 h-4" />
							Reset
						</Button>
					</div>
				</form>

				<div className="rounded-lg border border-border p-4">
					<div className="flex items-center justify-between gap-3">
						<p className="text-sm font-medium">Mock state preview</p>
						{saved ? (
							<span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
								Saved locally
							</span>
						) : (
							<span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
								Unsaved changes
							</span>
						)}
					</div>
					<pre className="mt-3 overflow-x-auto rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
{JSON.stringify(values, null, 2)}
					</pre>
				</div>
			</CardContent>
		</Card>
	)
}
