import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Check, Mail, MapPin, Phone, Quote } from "lucide-react"

import { LandingContactForm } from "@/components/landing/contact-form"
import { Logo } from "@/components/ui/logo"
import { PublicHeader } from "@/components/landing/public-header"
import { Button } from "@/components/ui/button"
import { getLandingContent } from "@/lib/landing"

type LandingContent = Awaited<ReturnType<typeof getLandingContent>>

function SectionTitle({ title, description }: { title: string; description: string }) {
  return <div className="mx-auto max-w-2xl space-y-3 text-center"><h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2><p className="text-base leading-7 text-muted-foreground">{description}</p></div>
}

function PersonImage({ src, name }: { src: string | null; name: string }) {
  if (src) return <img src={src} alt={name} className="size-12 rounded-full object-cover" />
  return <div className="flex size-12 items-center justify-center rounded-full bg-muted text-sm font-semibold">{name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>
}

export function LandingPage({ landing }: { landing: LandingContent }) {
  const { page, sections, team, testimonials } = landing
  const enabled = new Set(sections.map((section) => section.key))
  const renderSection = (key: string) => {
    if (!enabled.has(key)) return null
    if (key === "hero") return (
      <section key={key} id="home" className="landing-hero py-20 sm:py-24">
        <div className="landing-hero-content container grid items-center gap-12 lg:min-h-[540px] lg:grid-cols-2 lg:gap-16">
        <div className="grid justify-items-center gap-y-5 text-center lg:justify-items-start lg:text-left">
          <p className="landing-reveal landing-reveal-1 rounded-full border px-3 py-1 text-sm font-medium">{page.heroEyebrow}</p>
          <h1 className="landing-reveal landing-reveal-2 max-w-4xl text-4xl font-black leading-none tracking-tight sm:text-5xl lg:text-6xl">{page.heroTitle}</h1>
          <p className="landing-reveal landing-reveal-3 max-w-prose text-lg">{page.heroDescription}</p>
          <div className="landing-reveal landing-reveal-4 flex gap-x-2"><Button asChild size="lg"><Link href="/signin">{page.heroPrimaryLabel}<ArrowRight className="size-4" /></Link></Button><Button asChild variant="secondary" size="lg"><Link href="#about">{page.heroSecondaryLabel}</Link></Button></div>
        </div>
        <div className="landing-hero-media landing-reveal landing-reveal-5 w-full rounded-2xl border p-3 shadow-sm md:p-6"><div className="relative aspect-video overflow-hidden rounded-xl bg-muted p-3 md:p-6"><Image src="/images/misc/hero.png" alt="AflaxFiness dashboard preview" fill sizes="(max-width: 1024px) 100vw, 50vw" priority className="object-cover object-top dark:hidden" /><Image src="/images/misc/hero-dark.png" alt="AflaxFiness dashboard preview" fill sizes="(max-width: 1024px) 100vw, 50vw" priority className="hidden object-cover object-top dark:block" />{page.heroImage ? <Image src={page.heroImage} alt="AflaxFiness dashboard preview" fill sizes="(max-width: 1024px) 100vw, 50vw" priority className="object-cover object-top" /> : null}</div></div>
        </div>
      </section>
    )
    if (key === "about") return (
      <section key={key} id="about" className="landing-section container grid gap-8 py-14 sm:grid-cols-[1.1fr_0.9fr] sm:items-center sm:py-20">
        <div className="space-y-5"><p className="text-sm font-medium text-muted-foreground">ABOUT AFLAXFINESS</p><h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{page.aboutTitle}</h2><p className="max-w-xl text-base leading-7 text-muted-foreground">{page.aboutDescription}</p></div>
        <div className="grid gap-3 rounded-2xl border bg-card p-5 shadow-sm">{["One source of truth for daily operations", "A clear experience for your staff and members", "Flexible enough to grow with your gym"].map((item) => <div key={item} className="flex gap-3 text-sm font-medium"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="size-3.5" /></span>{item}</div>)}</div>
      </section>
    )
    if (key === "testimonials") return (
      <section key={key} id="testimonials" className="landing-section border-y bg-muted/40 py-14 sm:py-20"><div className="container space-y-9"><SectionTitle title="What our community says" description="Stories from the people who use AflaxFiness to make day-to-day operations easier." /><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{testimonials.length ? testimonials.map((item) => <article key={item.id} className="landing-card flex flex-col gap-5 rounded-lg border bg-card p-5 shadow-sm"><Quote className="size-5 text-muted-foreground" /><p className="flex-1 text-sm leading-6">{item.quote}</p><div className="flex items-center gap-3"><PersonImage src={item.image} name={item.name} /><div><p className="text-sm font-semibold">{item.name}</p>{item.role ? <p className="text-xs text-muted-foreground">{item.role}</p> : null}</div></div></article>) : <p className="col-span-full rounded-lg border border-dashed bg-background p-8 text-center text-sm text-muted-foreground">Member stories will appear here soon.</p>}</div></div></section>
    )
    if (key === "team") return (
      <section key={key} id="team" className="landing-section container space-y-9 py-14 sm:py-20"><SectionTitle title="Meet our team" description="The people behind a better, more connected gym experience." /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{team.length ? team.map((member) => <article key={member.id} className="landing-card rounded-lg border bg-card p-5 shadow-sm"><PersonImage src={member.image} name={member.name} /><h3 className="mt-4 text-lg font-semibold">{member.name}</h3><p className="mt-1 text-sm text-muted-foreground">{member.role}</p>{member.bio ? <p className="mt-4 text-sm leading-6 text-muted-foreground">{member.bio}</p> : null}</article>) : <p className="col-span-full rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Team profiles will appear here soon.</p>}</div></section>
    )
    if (key === "contact") return (
      <section key={key} id="contact" className="landing-section border-t bg-muted/40 py-14 sm:py-20"><div className="container grid gap-8 lg:grid-cols-[0.8fr_1.2fr]"><div className="space-y-6"><div><p className="text-sm font-medium text-muted-foreground">CONTACT US</p><h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Let&apos;s talk about your gym.</h2><p className="mt-3 text-base leading-7 text-muted-foreground">Have a question or want to see how AflaxFiness fits your operation? Send us a message.</p></div><div className="grid gap-4 text-sm">{page.contactEmail ? <a href={`mailto:${page.contactEmail}`} className="flex items-center gap-3"><Mail className="size-4 text-muted-foreground" />{page.contactEmail}</a> : null}{page.contactPhone ? <a href={`tel:${page.contactPhone}`} className="flex items-center gap-3"><Phone className="size-4 text-muted-foreground" />{page.contactPhone}</a> : null}{page.contactAddress ? <p className="flex items-center gap-3"><MapPin className="size-4 text-muted-foreground" />{page.contactAddress}</p> : null}</div></div><LandingContactForm /></div></section>
    )
    return null
  }

  if (!page.published) return <main className="grid min-h-svh place-items-center bg-muted/40 p-6"><div className="max-w-md rounded-lg border bg-card p-8 text-center shadow-sm"><Logo href={null} /><h1 className="mt-8 text-2xl font-semibold">We&apos;ll be right back.</h1><p className="mt-3 text-sm text-muted-foreground">Our website is being updated. Please check again soon.</p></div></main>

  return <div className="min-h-svh bg-background"><PublicHeader /><main className="space-y-16 bg-muted/40 py-10 sm:py-16">{sections.map((section) => renderSection(section.key))}</main><footer className="border-t border-sidebar-border bg-background"><div className="container flex flex-col gap-2 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><Logo href="/" /><span>© {new Date().getFullYear()} AflaxFiness. All rights reserved.</span></div></footer></div>
}
