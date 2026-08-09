"use client"

import { useEffect, useMemo, useState } from "react"
import { Eye, GripVertical, Pencil, Plus, Save, Trash2 } from "lucide-react"
import useSWR from "swr"
import { toast } from "sonner"

import { AccessCard, AccessPageHeader, FieldBlock, Pill, TableEmpty, TableSkeleton } from "@/components/access-control/shared"
import { LocalImageUpload } from "@/components/access-control/local-image-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { apiRequest } from "@/lib/client-api"
import { fetcher } from "@/lib/swr"

export type LandingManagementView = "content" | "sections" | "team" | "testimonials" | "inbox"

type Section = { id: string; key: string; label: string; position: number; published: boolean }
type Person = { id: string; name: string; role: string | null; image: string | null; bio?: string | null; quote?: string; published: boolean }
type LandingPageRecord = { published: boolean; heroEyebrow: string; heroTitle: string; heroDescription: string; heroImage: string | null; heroPrimaryLabel: string; heroSecondaryLabel: string; aboutTitle: string; aboutDescription: string; contactEmail: string | null; contactPhone: string | null; contactAddress: string | null }
type ContactMessage = { id: string; name: string; email: string; phone: string | null; message: string; status: "NEW" | "READ" | "ARCHIVED"; createdAt: string }
type Response = { landing: { page: LandingPageRecord; sections: Section[]; team: Person[]; testimonials: Person[] }; messages: ContactMessage[] }

const emptyTeam = { name: "", role: "", bio: "", image: "", published: true }
const emptyTestimonial = { name: "", role: "", quote: "", image: "", published: true }

const viewMeta: Record<LandingManagementView, { title: string; description: string }> = {
  content: { title: "Landing content", description: "Edit your public website copy, hero image, calls to action, and publication status." },
  sections: { title: "Section layout", description: "Choose which landing-page sections appear and drag them into their display order." },
  team: { title: "Our team", description: "Create, edit, publish, and order the people presented on your website." },
  testimonials: { title: "Testimonials", description: "Manage approved customer stories that appear on the public website." },
  inbox: { title: "Contact inbox", description: "Read and manage messages received from your public contact form." },
}

function PublishToggle({ checked, onChange, label = "Published" }: { checked: boolean; onChange: (value: boolean) => void; label?: string }) {
  return <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 rounded border-border" />{label}</label>
}

function PersonAvatar({ person }: { person: Person }) {
  if (person.image) return <img src={person.image} alt={person.name} className="size-11 rounded-full object-cover" />
  return <div className="flex size-11 items-center justify-center rounded-full bg-muted text-sm font-semibold">{person.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>
}

export function LandingManagementPage({ view = "content" }: { view?: LandingManagementView }) {
  const { data, error, isLoading, mutate } = useSWR<Response>("/api/v1/access-control/landing", fetcher)
  const [page, setPage] = useState<LandingPageRecord | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [dragId, setDragId] = useState<string | null>(null)
  const [savingPage, setSavingPage] = useState(false)
  const [savingSections, setSavingSections] = useState(false)
  const [teamForm, setTeamForm] = useState(emptyTeam)
  const [testimonialForm, setTestimonialForm] = useState(emptyTestimonial)
  const [editingTeam, setEditingTeam] = useState<string | null>(null)
  const [editingTestimonial, setEditingTestimonial] = useState<string | null>(null)
  const [savingPerson, setSavingPerson] = useState<"team" | "testimonial" | null>(null)

  useEffect(() => {
    if (!data) return
    setPage(data.landing.page)
    setSections([...data.landing.sections].sort((a, b) => a.position - b.position))
  }, [data])

  const orderedSections = useMemo(() => sections.map((section, position) => ({ ...section, position })), [sections])
  const savePage = async () => {
    if (!page) return
    setSavingPage(true)
    try { await apiRequest("/api/v1/access-control/landing", { method: "PUT", body: page }); toast.success("Landing content saved"); mutate() }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save landing content") }
    finally { setSavingPage(false) }
  }
  const saveSections = async () => {
    setSavingSections(true)
    try { await apiRequest("/api/v1/access-control/landing/sections", { method: "PUT", body: { sections: orderedSections } }); toast.success("Section layout saved"); mutate() }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save section layout") }
    finally { setSavingSections(false) }
  }
  const moveSection = (targetId: string) => {
    if (!dragId || dragId === targetId) return
    setSections((current) => {
      const from = current.findIndex((section) => section.id === dragId)
      const to = current.findIndex((section) => section.id === targetId)
      const next = [...current]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    setDragId(null)
  }
  const saveTeam = async () => {
    const endpoint = editingTeam ? `/api/v1/access-control/landing/team/${editingTeam}` : "/api/v1/access-control/landing/team"
    setSavingPerson("team")
    try { await apiRequest(endpoint, { method: editingTeam ? "PUT" : "POST", body: teamForm }); toast.success(editingTeam ? "Team member updated" : "Team member added"); setTeamForm(emptyTeam); setEditingTeam(null); mutate() }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save team member") }
    finally { setSavingPerson(null) }
  }
  const saveTestimonial = async () => {
    const endpoint = editingTestimonial ? `/api/v1/access-control/landing/testimonials/${editingTestimonial}` : "/api/v1/access-control/landing/testimonials"
    setSavingPerson("testimonial")
    try { await apiRequest(endpoint, { method: editingTestimonial ? "PUT" : "POST", body: testimonialForm }); toast.success(editingTestimonial ? "Testimonial updated" : "Testimonial added"); setTestimonialForm(emptyTestimonial); setEditingTestimonial(null); mutate() }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save testimonial") }
    finally { setSavingPerson(null) }
  }
  const deleteItem = async (kind: "team" | "testimonials", id: string) => {
    if (!window.confirm("Remove this item?")) return
    try { await apiRequest(`/api/v1/access-control/landing/${kind}/${id}`, { method: "DELETE" }); toast.success("Item removed"); mutate() }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to remove item") }
  }
  const updateMessage = async (id: string, status: ContactMessage["status"]) => {
    try { await apiRequest(`/api/v1/access-control/landing/messages/${id}`, { method: "PUT", body: { status } }); mutate() }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update message") }
  }

  if (error) return <TableEmpty title="Could not load website content" description="Refresh the page and try again." />
  if (isLoading || !data || !page) return <TableSkeleton columns={3} rows={7} />

  return <div className="space-y-6">
    <AccessPageHeader breadcrumb={["Dashboard", "Website", viewMeta[view].title]} title={viewMeta[view].title} description={viewMeta[view].description} action={<Button asChild variant="outline"><a href="/" target="_blank"><Eye className="size-4" />View website</a></Button>} />

    {view === "content" ? <AccessCard title="Landing page copy" description="The hero image and copy below are shown on the public website after saving." action={<PublishToggle checked={page.published} onChange={(published) => setPage((current) => current ? { ...current, published } : current)} label="Website published" />}>
      <div className="grid gap-5 lg:grid-cols-2">
        <FieldBlock label="Hero eyebrow"><Input value={page.heroEyebrow} onChange={(event) => setPage({ ...page, heroEyebrow: event.target.value })} /></FieldBlock>
        <FieldBlock label="Hero title"><Input value={page.heroTitle} onChange={(event) => setPage({ ...page, heroTitle: event.target.value })} /></FieldBlock>
        <div className="lg:col-span-2"><FieldBlock label="Hero description"><Textarea value={page.heroDescription} onChange={(event) => setPage({ ...page, heroDescription: event.target.value })} /></FieldBlock></div>
        <div className="lg:col-span-2"><LocalImageUpload label="Hero section image" hint="Upload the dashboard or product image shown beneath the hero. Remove it to restore the Shadboard default preview." value={page.heroImage ?? ""} onChange={(heroImage) => setPage({ ...page, heroImage })} /></div>
        <FieldBlock label="Primary button"><Input value={page.heroPrimaryLabel} onChange={(event) => setPage({ ...page, heroPrimaryLabel: event.target.value })} /></FieldBlock>
        <FieldBlock label="Secondary button"><Input value={page.heroSecondaryLabel} onChange={(event) => setPage({ ...page, heroSecondaryLabel: event.target.value })} /></FieldBlock>
        <FieldBlock label="About us title"><Input value={page.aboutTitle} onChange={(event) => setPage({ ...page, aboutTitle: event.target.value })} /></FieldBlock>
        <FieldBlock label="Contact email"><Input type="email" value={page.contactEmail ?? ""} onChange={(event) => setPage({ ...page, contactEmail: event.target.value })} /></FieldBlock>
        <div className="lg:col-span-2"><FieldBlock label="About us description"><Textarea value={page.aboutDescription} onChange={(event) => setPage({ ...page, aboutDescription: event.target.value })} /></FieldBlock></div>
        <FieldBlock label="Contact phone"><Input value={page.contactPhone ?? ""} onChange={(event) => setPage({ ...page, contactPhone: event.target.value })} /></FieldBlock>
        <FieldBlock label="Contact address"><Input value={page.contactAddress ?? ""} onChange={(event) => setPage({ ...page, contactAddress: event.target.value })} /></FieldBlock>
      </div>
      <div className="mt-5"><Button onClick={savePage} disabled={savingPage}>{savingPage ? <Spinner /> : <Save className="size-4" />}{savingPage ? "Saving..." : "Save landing content"}</Button></div>
    </AccessCard> : null}

    {view === "sections" ? <AccessCard title="Landing-page section order" description="Drag a section to change the public page order. Uncheck a section to hide it." action={<Button onClick={saveSections} disabled={savingSections} variant="outline">{savingSections ? <Spinner /> : <Save className="size-4" />}Save layout</Button>}><div className="grid gap-2">{sections.map((section) => <div key={section.id} draggable onDragStart={() => setDragId(section.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => moveSection(section.id)} className="flex items-center gap-3 rounded-md border bg-background p-3"><GripVertical className="size-4 cursor-grab text-muted-foreground" /><span className="flex-1 text-sm font-medium">{section.label}</span><PublishToggle checked={section.published} onChange={(published) => setSections((current) => current.map((entry) => entry.id === section.id ? { ...entry, published } : entry))} /></div>)}</div></AccessCard> : null}

    {view === "team" ? <div className="grid gap-6 2xl:grid-cols-2"><AccessCard title={editingTeam ? "Edit team member" : "Add team member"} description="Published profiles appear in the Our Team section."><div className="grid gap-4"><FieldBlock label="Name"><Input value={teamForm.name} onChange={(event) => setTeamForm({ ...teamForm, name: event.target.value })} /></FieldBlock><FieldBlock label="Role"><Input value={teamForm.role} onChange={(event) => setTeamForm({ ...teamForm, role: event.target.value })} /></FieldBlock><FieldBlock label="Short bio"><Textarea value={teamForm.bio} onChange={(event) => setTeamForm({ ...teamForm, bio: event.target.value })} /></FieldBlock><LocalImageUpload label="Profile image" hint="Use a clear square or portrait image." value={teamForm.image} onChange={(image) => setTeamForm({ ...teamForm, image })} /><PublishToggle checked={teamForm.published} onChange={(published) => setTeamForm({ ...teamForm, published })} /><div className="flex gap-2"><Button onClick={saveTeam} disabled={savingPerson === "team"}>{savingPerson === "team" ? <Spinner /> : <Plus className="size-4" />}{editingTeam ? "Save member" : "Add member"}</Button>{editingTeam ? <Button variant="ghost" onClick={() => { setEditingTeam(null); setTeamForm(emptyTeam) }}>Cancel</Button> : null}</div></div></AccessCard><AccessCard title="Team members" description="Add, edit, publish, or remove public profiles."><div className="grid gap-3">{data.landing.team.length ? data.landing.team.map((person) => <div key={person.id} className="flex items-center gap-3 rounded-md border p-3"><PersonAvatar person={person} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{person.name}</p><p className="truncate text-xs text-muted-foreground">{person.role}</p></div><Pill variant={person.published ? "secondary" : "outline"}>{person.published ? "Live" : "Draft"}</Pill><Button size="icon" variant="ghost" onClick={() => { setEditingTeam(person.id); setTeamForm({ name: person.name, role: person.role ?? "", bio: person.bio ?? "", image: person.image ?? "", published: person.published }) }}><Pencil className="size-4" /></Button><Button size="icon" variant="ghost" onClick={() => deleteItem("team", person.id)}><Trash2 className="size-4 text-destructive" /></Button></div>) : <TableEmpty title="No team members" description="Add the first profile using the form." />}</div></AccessCard></div> : null}

    {view === "testimonials" ? <div className="grid gap-6 2xl:grid-cols-2"><AccessCard title={editingTestimonial ? "Edit testimonial" : "Add testimonial"} description="Use genuine member or partner feedback only."><div className="grid gap-4"><FieldBlock label="Name"><Input value={testimonialForm.name} onChange={(event) => setTestimonialForm({ ...testimonialForm, name: event.target.value })} /></FieldBlock><FieldBlock label="Role or gym"><Input value={testimonialForm.role} onChange={(event) => setTestimonialForm({ ...testimonialForm, role: event.target.value })} /></FieldBlock><FieldBlock label="Testimonial"><Textarea value={testimonialForm.quote} onChange={(event) => setTestimonialForm({ ...testimonialForm, quote: event.target.value })} /></FieldBlock><LocalImageUpload label="Photo" hint="Optional portrait image." value={testimonialForm.image} onChange={(image) => setTestimonialForm({ ...testimonialForm, image })} /><PublishToggle checked={testimonialForm.published} onChange={(published) => setTestimonialForm({ ...testimonialForm, published })} /><div className="flex gap-2"><Button onClick={saveTestimonial} disabled={savingPerson === "testimonial"}>{savingPerson === "testimonial" ? <Spinner /> : <Plus className="size-4" />}{editingTestimonial ? "Save testimonial" : "Add testimonial"}</Button>{editingTestimonial ? <Button variant="ghost" onClick={() => { setEditingTestimonial(null); setTestimonialForm(emptyTestimonial) }}>Cancel</Button> : null}</div></div></AccessCard><AccessCard title="Testimonials" description="Only published testimonials appear on the website."><div className="grid gap-3">{data.landing.testimonials.length ? data.landing.testimonials.map((person) => <div key={person.id} className="flex items-center gap-3 rounded-md border p-3"><PersonAvatar person={person} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{person.name}</p><p className="line-clamp-1 text-xs text-muted-foreground">{person.quote}</p></div><Pill variant={person.published ? "secondary" : "outline"}>{person.published ? "Live" : "Draft"}</Pill><Button size="icon" variant="ghost" onClick={() => { setEditingTestimonial(person.id); setTestimonialForm({ name: person.name, role: person.role ?? "", quote: person.quote ?? "", image: person.image ?? "", published: person.published }) }}><Pencil className="size-4" /></Button><Button size="icon" variant="ghost" onClick={() => deleteItem("testimonials", person.id)}><Trash2 className="size-4 text-destructive" /></Button></div>) : <TableEmpty title="No testimonials" description="Add approved feedback using the form." />}</div></AccessCard></div> : null}

    {view === "inbox" ? <AccessCard title="Contact inbox" description="Messages sent from the public contact form."><div className="grid gap-3">{data.messages.length ? data.messages.map((message) => <article key={message.id} className="rounded-md border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{message.name}</p><a href={`mailto:${message.email}`} className="text-sm text-muted-foreground hover:text-foreground">{message.email}</a></div><select value={message.status} onChange={(event) => updateMessage(message.id, event.target.value as ContactMessage["status"])} className="h-8 rounded-md border bg-background px-2 text-sm"><option value="NEW">New</option><option value="READ">Read</option><option value="ARCHIVED">Archived</option></select></div><p className="mt-3 text-sm leading-6 text-muted-foreground">{message.message}</p>{message.phone ? <p className="mt-2 text-xs text-muted-foreground">{message.phone}</p> : null}</article>) : <TableEmpty title="No contact messages" description="New website inquiries will appear here." />}</div></AccessCard> : null}
  </div>
}
