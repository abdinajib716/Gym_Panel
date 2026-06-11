import { notFound } from "next/navigation"

import { ComingSoonPage } from "@/components/admin/coming-soon-page"
import { StarterShell } from "@/components/admin/starter-shell"
import { getPlaceholderItem } from "@/lib/navigation"

type PageProps = {
  params: Promise<{
    item: string
  }>
}

export default async function PlaceholderItemPage({ params }: PageProps) {
  const { item } = await params
  const navItem = getPlaceholderItem(item)

  if (!navItem) {
    notFound()
  }

  return (
    <StarterShell>
      <ComingSoonPage item={navItem} />
    </StarterShell>
  )
}
