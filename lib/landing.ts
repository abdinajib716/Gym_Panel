import { prisma } from "@/lib/prisma"

export const landingSectionDefaults = [
  { key: "hero", label: "Hero", position: 0 },
  { key: "about", label: "About us", position: 1 },
  { key: "testimonials", label: "Testimonials", position: 2 },
  { key: "team", label: "Our team", position: 3 },
  { key: "contact", label: "Contact us", position: 4 },
] as const

export async function ensureLandingPage() {
  const page = await prisma.landingPage.upsert({
    where: { key: "global" },
    update: {},
    create: { key: "global" },
  })

  await prisma.landingSection.createMany({
    data: landingSectionDefaults.map((section) => ({ ...section, pageId: page.id })),
    skipDuplicates: true,
  })

  // Preserve useful legacy testimonials that were already entered in the
  // production website tables before this landing manager was added.
  if (await prisma.landingTestimonial.count() === 0) {
    const legacyTestimonials = await prisma.webTestimonial.findMany({ orderBy: { displayOrder: "asc" } })
    if (legacyTestimonials.length) {
      await prisma.landingTestimonial.createMany({
        data: legacyTestimonials.map((testimonial, position) => ({
          name: testimonial.name,
          role: testimonial.gym,
          quote: testimonial.review,
          position,
          published: testimonial.published,
        })),
      })
    }
  }

  if (await prisma.landingTeamMember.count() === 0) {
    await prisma.landingTeamMember.createMany({
      data: [
        { name: "Ayaan Hassan", role: "Founder & Gym Operations", bio: "Keeps every AflaxFiness workflow focused on the people running great gyms.", position: 0, published: true },
        { name: "Hodan Ali", role: "Member Experience Lead", bio: "Helps gyms build a welcoming experience for every member from day one.", position: 1, published: true },
        { name: "Mohamed Farah", role: "Fitness Programs Lead", bio: "Turns training plans and coach schedules into clear, practical daily routines.", position: 2, published: true },
        { name: "Sahra Nur", role: "Customer Success Manager", bio: "Partners with gym teams to make their operations simpler and more connected.", position: 3, published: true },
      ],
    })
  }

  return page
}

export async function getLandingContent({ includeDrafts = false }: { includeDrafts?: boolean } = {}) {
  const page = await ensureLandingPage()
  const published = includeDrafts ? undefined : true

  const [sections, team, testimonials] = await Promise.all([
    prisma.landingSection.findMany({
      where: { pageId: page.id, ...(published === undefined ? {} : { published }) },
      orderBy: { position: "asc" },
    }),
    prisma.landingTeamMember.findMany({
      where: published === undefined ? {} : { published },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    }),
    prisma.landingTestimonial.findMany({
      where: published === undefined ? {} : { published },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    }),
  ])

  return { page, sections, team, testimonials }
}
