import { LandingPage } from "@/components/landing/landing-page"
import { getLandingContent } from "@/lib/landing"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const landing = await getLandingContent()
  return <LandingPage landing={landing} />
}
