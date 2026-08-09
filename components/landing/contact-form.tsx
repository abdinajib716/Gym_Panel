"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { apiRequest } from "@/lib/client-api"

export function LandingContactForm() {
  const [submitting, setSubmitting] = useState(false)
  const [values, setValues] = useState({ name: "", email: "", phone: "", message: "" })

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const response = await apiRequest<{ message: string }>("/api/v1/landing", { method: "POST", body: values })
      toast.success(response.message)
      setValues({ name: "", email: "", phone: "", message: "" })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send your message")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">Name
          <Input required value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} placeholder="Your name" />
        </label>
        <label className="grid gap-2 text-sm font-medium">Email
          <Input required type="email" value={values.email} onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))} placeholder="name@example.com" />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium">Phone <span className="font-normal text-muted-foreground">(optional)</span>
        <Input value={values.phone} onChange={(event) => setValues((current) => ({ ...current, phone: event.target.value }))} placeholder="+252..." />
      </label>
      <label className="grid gap-2 text-sm font-medium">How can we help?
        <Textarea required value={values.message} onChange={(event) => setValues((current) => ({ ...current, message: event.target.value }))} placeholder="Tell us a little about your gym." className="min-h-32" />
      </label>
      <Button type="submit" className="w-full sm:w-fit" disabled={submitting}>
        {submitting ? <Spinner /> : <Send className="size-4" />}
        {submitting ? "Sending..." : "Send message"}
      </Button>
    </form>
  )
}
