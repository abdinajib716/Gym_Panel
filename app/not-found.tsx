import Link from "next/link"
import { Compass } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-12">
      <Card className="w-full max-w-xl overflow-hidden">
        <CardHeader className="border-b border-border/70 bg-linear-to-br from-primary/10 via-transparent to-secondary/15">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Compass className="size-6" />
          </div>
          <CardTitle className="text-3xl" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Page not found
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            That route is not part of this starter yet. Head back to the dashboard and plug in the module you want to build next.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
