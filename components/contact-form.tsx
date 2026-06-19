"use client"

import { type FormEvent, useState } from "react"

const topics = [
  { value: "sales", label: "Talk to sales" },
  { value: "demo", label: "Request a demo" },
  { value: "support", label: "Product support" },
  { value: "partnership", label: "Partnership" },
  { value: "integration", label: "Integration request" },
  { value: "general", label: "Something else" },
]

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    topic: "",
    message: "",
  })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })

    const data = await response.json().catch(() => null)
    setIsSubmitting(false)

    if (!response.ok) {
      setError(data?.error || "Could not send your message. Please try again.")
      return
    }

    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="border border-accent/30 bg-accent/5 p-8 text-center">
        <h2 className="font-[var(--font-bebas)] text-3xl tracking-tight mb-3">Message sent.</h2>
        <p className="font-mono text-sm text-muted-foreground leading-relaxed">
          {"We've received your message and will get back to you within one business day."}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Name" required>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(event) => setFormData({ ...formData, name: event.target.value })}
            placeholder="Your name"
            className="contact-input"
          />
        </Field>
        <Field label="Business email" required>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(event) => setFormData({ ...formData, email: event.target.value })}
            placeholder="you@company.com"
            className="contact-input"
          />
        </Field>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Company">
          <input
            type="text"
            value={formData.company}
            onChange={(event) => setFormData({ ...formData, company: event.target.value })}
            placeholder="Your company"
            className="contact-input"
          />
        </Field>
        <Field label="What's this about?" required>
          <select
            required
            value={formData.topic}
            onChange={(event) => setFormData({ ...formData, topic: event.target.value })}
            className="contact-input"
          >
            <option value="">Select a topic</option>
            {topics.map((topic) => (
              <option key={topic.value} value={topic.value}>
                {topic.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Message" required>
        <textarea
          required
          rows={5}
          value={formData.message}
          onChange={(event) => setFormData({ ...formData, message: event.target.value })}
          placeholder="Tell us what you're looking for."
          className="contact-input resize-none"
        />
      </Field>

      {error ? (
        <div className="border border-destructive/40 bg-destructive/10 p-3 font-mono text-xs text-destructive">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-accent px-6 py-4 font-mono text-xs uppercase tracking-widest text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Sending..." : "Send Message"}
      </button>
    </form>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  )
}
