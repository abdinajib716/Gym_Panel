import { Clock3, Sparkles } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type ComingSoonProps = {
  eyebrow: string
  title: string
  description: string
  points: string[]
}

export function ComingSoon({ eyebrow, title, description, points }: ComingSoonProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/70 bg-linear-to-br from-primary/8 via-transparent to-secondary/10">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          <Clock3 className="size-3.5" />
          {eyebrow}
        </div>
        <CardTitle className="text-xl" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        {points.map((point) => (
          <div key={point} className="flex items-center gap-3 rounded-2xl border border-dashed border-border/80 bg-background/60 px-4 py-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </div>
            <p className="text-sm text-muted-foreground">{point}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
