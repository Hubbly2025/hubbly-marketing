"use client"

import { FormEvent, useMemo, useState } from "react"
import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function getParam(params: URLSearchParams, key: string) {
  return params.get(key)?.trim() || ""
}

export default function WaitlistSignupPage() {
  return (
    <Suspense fallback={<WaitlistShell />}>
      <WaitlistSignupContent />
    </Suspense>
  )
}

function WaitlistSignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const auditData = useMemo(() => ({
    audit_id: getParam(searchParams, "audit_id"),
    url: getParam(searchParams, "url"),
    prospects: Number(getParam(searchParams, "prospects") || 0),
    competitors: Number(getParam(searchParams, "competitors") || 0),
    score: getParam(searchParams, "score"),
  }), [searchParams])

  const [formData, setFormData] = useState({
    email: getParam(searchParams, "email"),
    company: getParam(searchParams, "company"),
    role: "",
    company_size: "",
    current_tools: "",
    pain_points: "",
    expected_results: "",
    timeline: "",
  })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    const response = await fetch("/api/waitlist/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        utm_source: getParam(searchParams, "source") || "waitlist",
        audit_url: auditData.url,
        audit_data: auditData,
      }),
    })

    const data = await response.json().catch(() => null)
    setIsSubmitting(false)

    if (!response.ok) {
      setError(data?.error || "Could not join the waitlist. Please try again.")
      return
    }

    router.push(`/waitlist/confirmation?email=${encodeURIComponent(formData.email)}&company=${encodeURIComponent(formData.company)}`)
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <a href="/" className="inline-flex items-center gap-3" aria-label="Hubbly home">
          <span className="flex h-9 w-9 items-center justify-center border border-[#FF6B35] text-[#FF6B35]">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" />
              <path d="M8.5 9.5L12 7.5L15.5 9.5V14.5L12 16.5L8.5 14.5V9.5Z" />
            </svg>
          </span>
          <span className="font-mono text-xs uppercase tracking-[0.3em]">Hubbly</span>
        </a>

        <section className="mt-12 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#FF6B35]">Private beta — 30 days free</p>
          <h1 className="mx-auto mt-5 max-w-3xl font-[var(--font-bebas)] text-5xl leading-none tracking-tight md:text-8xl">
            Join the waitlist. Get 30 days free.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/70">
            Join now and get your complete analysis, early access, 30 days free when we launch, and a strategy session when private beta slots open.
          </p>
        </section>

        {auditData.url ? (
          <section className="mx-auto mt-10 max-w-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/50">Analysis preview for {auditData.url}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <PreviewStat label="Prospects found" value={auditData.prospects ? auditData.prospects.toLocaleString() : "Pending"} />
              <PreviewStat label="Competitors mapped" value={auditData.competitors ? String(auditData.competitors) : "Mapped"} />
              <PreviewStat label="Opportunity score" value={auditData.score || "Queued"} />
            </div>
          </section>
        ) : null}

        <section className="mx-auto mt-10 max-w-3xl bg-white p-6 text-[#0A0A0A] shadow-2xl md:p-8">
          <h2 className="font-[var(--font-bebas)] text-4xl leading-none tracking-tight md:text-5xl">Get your complete revenue analysis</h2>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Business email" required>
                <input type="email" required value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} placeholder="you@company.com" className="waitlist-input" />
              </Field>
              <Field label="Company name" required>
                <input type="text" required value={formData.company} onChange={(event) => setFormData({ ...formData, company: event.target.value })} placeholder="Your company" className="waitlist-input" />
              </Field>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Your role" required>
                <select required value={formData.role} onChange={(event) => setFormData({ ...formData, role: event.target.value })} className="waitlist-input">
                  <option value="">Select your role</option>
                  <option value="founder">Founder/CEO</option>
                  <option value="cmo">CMO/Marketing leader</option>
                  <option value="cro">CRO/Sales leader</option>
                  <option value="marketing_manager">Marketing manager</option>
                  <option value="sales_manager">Sales manager</option>
                  <option value="operations">Operations</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Company size" required>
                <select required value={formData.company_size} onChange={(event) => setFormData({ ...formData, company_size: event.target.value })} className="waitlist-input">
                  <option value="">Select company size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-1000">201-1,000 employees</option>
                  <option value="1000+">1,000+ employees</option>
                </select>
              </Field>
            </div>

            <Field label="Current tools and stack">
              <input type="text" value={formData.current_tools} onChange={(event) => setFormData({ ...formData, current_tools: event.target.value })} placeholder="HubSpot, Salesforce, Apollo, Smartlead" className="waitlist-input" />
            </Field>

            <Field label="Biggest revenue challenge" required>
              <textarea required rows={3} value={formData.pain_points} onChange={(event) => setFormData({ ...formData, pain_points: event.target.value })} placeholder="What's blocking lead generation, sales, or follow-up?" className="waitlist-input resize-none" />
            </Field>

            <Field label="What results are you looking for?" required>
              <textarea required rows={3} value={formData.expected_results} onChange={(event) => setFormData({ ...formData, expected_results: event.target.value })} placeholder="More qualified leads, booked meetings, better conversion, less manual work" className="waitlist-input resize-none" />
            </Field>

            <Field label="Implementation timeline">
              <select value={formData.timeline} onChange={(event) => setFormData({ ...formData, timeline: event.target.value })} className="waitlist-input">
                <option value="">Select timeline</option>
                <option value="immediate">Ready to start immediately</option>
                <option value="30_days">Within 30 days</option>
                <option value="90_days">Within 90 days</option>
                <option value="exploring">Just exploring options</option>
              </select>
            </Field>

            <div className="border border-[#FF6B35]/25 bg-[#FF6B35]/10 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#B9471C]">What you'll get — 30 days free</p>
              <ul className="mt-3 space-y-2 text-sm text-black/70">
                <li>30 days free access when we launch</li>
                <li>Complete revenue audit with competitor analysis</li>
                <li>Prospect research and target audience mapping</li>
                <li>Custom GTM strategy with messaging recommendations</li>
                <li>Private beta access priority</li>
              </ul>
            </div>

            {error ? <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

            <button type="submit" disabled={isSubmitting} className="min-h-13 w-full bg-[#FF6B35] px-6 font-mono text-xs font-semibold uppercase tracking-widest text-[#0A0A0A] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? "Joining waitlist..." : "Join Waitlist & Get 30 Days Free"}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}

function WaitlistShell() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#FF6B35]">Private beta</p>
        <h1 className="mt-5 font-[var(--font-bebas)] text-5xl leading-none tracking-tight">Loading waitlist...</h1>
      </div>
    </main>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-black/75">{label}{required ? " *" : ""}</span>
      {children}
    </label>
  )
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-[#0A0A0A]/50 p-4 text-center">
      <div className="font-[var(--font-bebas)] text-4xl leading-none text-[#FF6B35]">{value}</div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">{label}</div>
    </div>
  )
}
