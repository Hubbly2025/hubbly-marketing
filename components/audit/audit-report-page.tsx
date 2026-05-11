"use client"

import { useEffect, useMemo, useState } from "react"

type Persona = {
  title?: string
  company_size?: string
  pain_point?: string
  trigger?: string
}

type Competitor = {
  name?: string
  their_angle?: string
  their_weakness?: string
  your_opening?: string
}

type SampleEmail = {
  subject?: string
  body?: string
}

type Audit = {
  id: string
  url: string
  status: "processing" | "complete" | "failed"
  created_at?: string
  completed_at?: string
  analysis?: {
    company_name?: string
    product?: string
    industry?: string
    icp?: {
      primary?: Persona
      secondary?: Persona
      emerging?: Persona
    }
    competitors?: Competitor[]
    gtm_gaps?: string[]
    outreach_angle?: string
    sample_email?: SampleEmail
    error?: string
  }
  competitors?: Competitor[]
  intent_data?: {
    monthly?: number
    weekly?: number
    highIntent?: number
    high_intent?: number
    label?: string
    top_signals?: string[]
    geographies?: Array<{ region?: string; count?: number }>
  }
  gtm_plan?: {
    week_1?: Record<string, unknown>
    week_2_3?: Record<string, unknown>
    week_4?: Record<string, unknown>
  }
  sample_email?: SampleEmail
}

export function AuditReportPage({ auditId }: { auditId: string }) {
  const [audit, setAudit] = useState<Audit | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadAudit() {
      try {
        const response = await fetch(`/api/audit/${auditId}`, { cache: "no-store" })
        const data = await response.json()

        if (!cancelled && response.ok) {
          setAudit(data.audit)
          setError("")
        }

        if (!cancelled && !response.ok) {
          setError(data?.error || "Could not load audit.")
        }
      } catch {
        if (!cancelled) {
          setError("Could not load audit.")
        }
      }
    }

    loadAudit()
    const interval = window.setInterval(loadAudit, 3000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [auditId])

  if (error && !audit) {
    return <FailedState />
  }

  if (!audit || audit.status === "processing") {
    return <ProcessingState />
  }

  if (audit.status === "failed") {
    return <FailedState />
  }

  return <CompleteReport audit={audit} />
}

function ProcessingState() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-12 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-xl flex-col items-center justify-center text-center">
        <HubblyLogo />
        <div className="mt-10 h-3 w-3 animate-pulse rounded-full bg-[#FF6B35]" />
        <h1 className="mt-6 font-[var(--font-bebas)] text-4xl tracking-tight md:text-6xl">
          Your report is almost ready...
        </h1>
      </div>
    </main>
  )
}

function FailedState() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-12 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-xl flex-col items-center justify-center text-center">
        <HubblyLogo />
        <h1 className="mt-10 font-[var(--font-bebas)] text-4xl tracking-tight md:text-6xl">
          We couldn't analyze that site.
        </h1>
        <p className="mt-4 max-w-lg font-mono text-sm leading-6 text-white/60">
          It may block automated tools or require JavaScript. Try a different URL or enter your company details manually.
        </p>
        <a
          href="/#close"
          className="mt-8 inline-flex min-h-12 items-center justify-center bg-[#FF6B35] px-6 font-mono text-xs uppercase tracking-widest text-[#0A0A0A] transition-colors duration-200 hover:opacity-90"
        >
          Try a different URL →
        </a>
      </div>
    </main>
  )
}

function CompleteReport({ audit }: { audit: Audit }) {
  const analysis = audit.analysis ?? {}
  const domain = useMemo(() => getDomain(audit.url), [audit.url])
  const companyName = analysis.company_name || domain
  const competitors = audit.competitors?.length ? audit.competitors : analysis.competitors ?? []
  const intent = audit.intent_data ?? {}
  const monthly = intent.monthly ?? 0
  const weekly = intent.weekly ?? 0
  const highIntent = intent.highIntent ?? intent.high_intent ?? 0
  const sampleEmail = audit.sample_email ?? analysis.sample_email ?? {}
  const generatedDate = formatDate(audit.completed_at || audit.created_at)

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="mx-auto max-w-7xl px-5 py-8 md:px-10 md:py-12">
        <header className="space-y-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <HubblyLogo />
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#FF6B35]">
              GTM Intelligence Report
            </p>
          </div>

          <div className="text-center">
            <h1 className="font-[var(--font-bebas)] text-5xl tracking-tight md:text-8xl">
              {companyName} — {domain}
            </h1>
            <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-white/55">
              Generated: {generatedDate}
            </p>
          </div>

          <div className="h-px w-full bg-[#FF6B35]" />
        </header>

        <div className="mt-14 space-y-14 md:mt-20 md:space-y-20">
          <ReportSection eyebrow="Section 1" title="What Hubbly found">
            <div className="grid gap-4 md:grid-cols-2">
              <SnapshotRow label="Product/service" value={analysis.product} />
              <SnapshotRow label="Industry" value={analysis.industry} />
              <SnapshotRow label="Target market" value={analysis.icp?.primary?.title} />
              <SnapshotRow label="Current positioning" value={analysis.outreach_angle} />
              <SnapshotRow label="Primary CTA" value="Captured from website CTA language during audit" />
              <SnapshotRow label="Tech stack" value="Public website signals reviewed during audit" />
            </div>
          </ReportSection>

          <ReportSection eyebrow="Section 2" title="Who actually buys this">
            <div className="grid gap-5 lg:grid-cols-3">
              <PersonaCard label="Primary" persona={analysis.icp?.primary} />
              <PersonaCard label="Secondary" persona={analysis.icp?.secondary} />
              <PersonaCard label="Emerging" persona={analysis.icp?.emerging} />
            </div>
            <p className="mt-6 border-l border-[#FF6B35] pl-4 font-mono text-sm text-white/70">
              These are the people Hubbly OS would find, contact, and book meetings with automatically.
            </p>
          </ReportSection>

          <ReportSection eyebrow="Section 3" title="Who you're up against">
            <div className="overflow-x-auto border border-white/10">
              <table className="w-full min-w-[820px] border-collapse text-left">
                <thead className="bg-white/[0.03] font-mono text-[10px] uppercase tracking-[0.22em] text-[#FF6B35]">
                  <tr>
                    <th className="border-b border-white/10 p-4">Competitor</th>
                    <th className="border-b border-white/10 p-4">Their angle</th>
                    <th className="border-b border-white/10 p-4">Their weakness</th>
                    <th className="border-b border-white/10 p-4">Your opening</th>
                  </tr>
                </thead>
                <tbody>
                  {competitors.slice(0, 5).map((competitor, index) => (
                    <tr key={`${competitor.name}-${index}`} className="border-b border-white/10 last:border-b-0">
                      <td className="p-4 font-mono text-sm text-white">{competitor.name || "Competitor"}</td>
                      <td className="p-4 text-sm text-white/70">{competitor.their_angle || "Positioning angle unavailable"}</td>
                      <td className="p-4 text-sm text-white/70">{competitor.their_weakness || "Weakness unavailable"}</td>
                      <td className="p-4 text-sm text-white/70">{competitor.your_opening || "Opening unavailable"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-5 font-mono text-xs text-white/55">
              Hubbly identifies prospects actively researching competitor alternatives and contacts them first.
            </p>
          </ReportSection>

          <ReportSection eyebrow="Section 4" title="People searching for you right now">
            <div className="border border-[#FF6B35]/60 bg-[#FF6B35]/[0.04] p-6 md:p-10">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/65">In the last 30 days</p>
              <div className="mt-4 font-[var(--font-bebas)] text-7xl leading-none text-[#FF6B35] md:text-9xl">
                {formatNumber(monthly)}
              </div>
              <p className="mt-4 max-w-2xl text-xl text-white md:text-2xl">
                people actively researched solutions like {companyName}.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <MetricCard label="Searched in the last 7 days" value={formatNumber(weekly)} />
                <MetricCard label="Showed high purchase intent" value={formatNumber(highIntent)} />
              </div>
              <p className="mt-6 font-mono text-xs text-white/55">
                {intent.label || `Estimated based on Hubbly Data category benchmarks for ${analysis.industry || "this market"}.`}
              </p>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <h3 className="font-mono text-xs uppercase tracking-[0.22em] text-[#FF6B35]">
                  Top intent signals detected
                </h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  {(intent.top_signals ?? []).slice(0, 5).map((signal) => (
                    <span key={signal} className="border border-[#FF6B35]/50 px-3 py-2 font-mono text-xs text-white/80">
                      {signal}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-mono text-xs uppercase tracking-[0.22em] text-[#FF6B35]">
                  Top buyer geographies
                </h3>
                <div className="mt-4 space-y-3">
                  {(intent.geographies ?? []).slice(0, 5).map((geo) => (
                    <div key={geo.region} className="grid grid-cols-[110px_1fr_70px] items-center gap-3 font-mono text-xs">
                      <span className="text-white/70">{geo.region}</span>
                      <span className="h-2 bg-white/10">
                        <span
                          className="block h-2 bg-[#FF6B35]"
                          style={{ width: `${Math.min(((geo.count ?? 0) / Math.max(monthly * 0.22, 1)) * 100, 100)}%` }}
                        />
                      </span>
                      <span className="text-right text-white">{formatNumber(geo.count ?? 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-8 font-[var(--font-bebas)] text-4xl leading-none text-[#FF6B35] md:text-6xl">
              These people are searching right now. Your competitors are already contacting some of them.
            </p>
          </ReportSection>

          <ReportSection eyebrow="Section 4A" title="Your invisible pipeline">
            <div className="grid gap-8 border border-white/10 bg-white/[0.03] p-6 md:p-10 lg:grid-cols-[1fr_0.8fr]">
              <div className="space-y-5 text-lg leading-8 text-white/78">
                <p>Most companies convert 1-3% of their website visitors.</p>
                <p>The other 97% leave without a trace.</p>
                <p className="text-white">With the Hubbly pixel installed on {companyName}:</p>
                <ul className="space-y-2 font-mono text-sm text-white/70">
                  <li>→ Every anonymous visitor gets identified</li>
                  <li>→ Name, company, title, and pages visited</li>
                  <li>→ Hubbly OS contacts them automatically</li>
                </ul>
              </div>
              <div className="border border-[#FF6B35]/50 p-6">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/55">
                  Typical monthly opportunity
                </p>
                <p className="mt-4 font-[var(--font-bebas)] text-6xl leading-none text-[#FF6B35]">
                  400-1,200
                </p>
                <p className="mt-3 text-sm text-white/65">
                  identifiable visitors per month for companies in {analysis.industry || "this industry"}.
                </p>
                <a
                  href="https://hubbly-os-web.vercel.app"
                  className="mt-6 inline-flex min-h-12 items-center justify-center bg-[#FF6B35] px-5 font-mono text-xs uppercase tracking-widest text-[#0A0A0A] transition-opacity duration-200 hover:opacity-90"
                >
                  Install the Hubbly Pixel — Free →
                </a>
              </div>
            </div>
          </ReportSection>

          <ReportSection eyebrow="Section 5" title="What's missing from your motion">
            <div className="grid gap-3 md:grid-cols-2">
              {["Website presence", "Product positioning"].map((item) => (
                <ChecklistItem key={item} complete label={item} />
              ))}
              {(analysis.gtm_gaps ?? []).slice(0, 6).map((gap) => (
                <ChecklistItem key={gap} label={gap} />
              ))}
            </div>
            <p className="mt-6 font-mono text-sm text-white/65">
              Hubbly OS fills every gap on this list automatically.
            </p>
          </ReportSection>

          <ReportSection eyebrow="Section 6" title="Your 30-day execution plan">
            <div className="grid gap-5 lg:grid-cols-3">
              <PlanColumn title="Week 1 — Foundation" items={audit.gtm_plan?.week_1} />
              <PlanColumn title="Week 2-3 — Outreach" items={audit.gtm_plan?.week_2_3} />
              <PlanColumn title="Week 4 — Optimize" items={audit.gtm_plan?.week_4} />
            </div>
          </ReportSection>

          <ReportSection eyebrow="Section 7" title="What Hubbly would send on your behalf">
            <div className="mx-auto max-w-3xl bg-white p-6 text-[#0A0A0A] shadow-2xl md:p-8">
              <div className="grid gap-2 border-b border-black/10 pb-4 font-mono text-xs">
                <p><span className="text-black/45">From:</span> Hubbly OS</p>
                <p><span className="text-black/45">To:</span> {analysis.icp?.primary?.title || "Primary buyer"}</p>
                <p><span className="text-black/45">Subject:</span> {sampleEmail.subject || "Quick question"}</p>
              </div>
              <div className="mt-6 whitespace-pre-line text-sm leading-7 text-black/80">
                {sampleEmail.body || "Sample email unavailable."}
              </div>
            </div>
            <p className="mt-5 text-center font-mono text-xs text-white/55">
              Hubbly OS generates and sends emails like this automatically — personalized for every lead, at scale.
            </p>
          </ReportSection>

          <section className="border border-[#FF6B35]/70 bg-[#FF6B35]/[0.06] p-6 text-center md:p-12">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#FF6B35]">
              Start your pipeline
            </p>
            <h2 className="mt-5 font-[var(--font-bebas)] text-5xl leading-none tracking-tight md:text-8xl">
              {formatNumber(monthly)} buyers are searching right now. Ready to reach them?
            </h2>
            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {["First pipeline in 10 minutes", "First meeting within 72 hours", "No sales team required"].map((value) => (
                <div key={value} className="border border-white/10 bg-[#0A0A0A]/50 p-4 font-mono text-xs text-white/75">
                  {value}
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="https://hubbly-os-web.vercel.app"
                className="inline-flex min-h-12 items-center justify-center bg-[#FF6B35] px-6 font-mono text-xs uppercase tracking-widest text-[#0A0A0A] transition-opacity duration-200 hover:opacity-90"
              >
                Start My Pipeline →
              </a>
              <a
                href="https://cal.com/hubbly/demo"
                className="inline-flex min-h-12 items-center justify-center border border-white/25 px-6 font-mono text-xs uppercase tracking-widest text-white transition-colors duration-200 hover:border-[#FF6B35] hover:text-[#FF6B35]"
              >
                Book a Demo →
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

function ReportSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="border-t border-[#FF6B35]/50 pt-6">
      <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#FF6B35]">{eyebrow}</p>
        <h2 className="font-[var(--font-bebas)] text-4xl leading-none tracking-tight text-white md:text-6xl">
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

function SnapshotRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="border border-white/10 bg-white/[0.03] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#FF6B35]">{label}</p>
      <p className="mt-3 text-sm leading-6 text-white/78">{value || "Not enough public data to determine confidently"}</p>
    </div>
  )
}

function PersonaCard({ label, persona }: { label: string; persona?: Persona }) {
  return (
    <div className="border border-white/10 bg-white/[0.03] p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#FF6B35]">{label}</p>
      <h3 className="mt-4 text-xl font-semibold text-white">{persona?.title || "Buyer title unavailable"}</h3>
      <dl className="mt-5 space-y-4 text-sm">
        <Detail label="Company size" value={persona?.company_size} />
        <Detail label="Pain point" value={persona?.pain_point} />
        <Detail label="Trigger" value={persona?.trigger} />
      </dl>
    </div>
  )
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</dt>
      <dd className="mt-1 leading-6 text-white/72">{value || "Unavailable"}</dd>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-[#0A0A0A]/50 p-5">
      <p className="font-[var(--font-bebas)] text-5xl leading-none text-white">{value}</p>
      <p className="mt-2 font-mono text-xs uppercase tracking-[0.14em] text-white/50">{label}</p>
    </div>
  )
}

function ChecklistItem({ complete = false, label }: { complete?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 border border-white/10 bg-white/[0.03] p-4">
      <span className={complete ? "text-emerald-400" : "text-red-400"}>{complete ? "✓" : "✗"}</span>
      <span className="text-sm text-white/76">{label}</span>
    </div>
  )
}

function PlanColumn({ title, items }: { title: string; items?: Record<string, unknown> }) {
  return (
    <div className="border border-white/10 bg-white/[0.03] p-5">
      <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-[#FF6B35]">{title}</h3>
      <div className="mt-5 space-y-4">
        {Object.entries(items ?? {}).map(([key, value]) => (
          <div key={key}>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
              {key.replace(/_/g, " ")}
            </p>
            <p className="mt-1 text-sm leading-6 text-white/72">{formatPlanValue(value)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function HubblyLogo() {
  return (
    <a href="/" className="inline-flex items-center gap-3" aria-label="Hubbly home">
      <span className="flex h-9 w-9 items-center justify-center border border-[#FF6B35] text-[#FF6B35]">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" />
          <path d="M8.5 9.5L12 7.5L15.5 9.5V14.5L12 16.5L8.5 14.5V9.5Z" />
        </svg>
      </span>
      <span className="font-mono text-xs uppercase tracking-[0.3em] text-white">Hubbly</span>
    </a>
  )
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

function formatDate(value?: string) {
  if (!value) return new Date().toLocaleDateString()

  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

function formatPlanValue(value: unknown): string {
  if (!value) return "Unavailable"

  if (typeof value === "string" || typeof value === "number") {
    return String(value)
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => `${key.replace(/_/g, " ")}: ${String(entry)}`)
      .join(" · ")
  }

  return String(value)
}
