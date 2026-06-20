"use client"

import { useEffect, useMemo, useState } from "react"
import type { Audit } from "./types"
import {
  A16Z_CORRECTED_EMAIL,
  formatDate,
  formatNumber,
  getDomain,
  isAndreessenHorowitzReport,
  replacePlanEmailPov,
} from "./audit-utils"
import {
  ChecklistItem,
  CorrectionNote,
  FailedState,
  HubblyLogo,
  MetricCard,
  PersonaCard,
  PlanColumn,
  ProcessingState,
  ReportSection,
  SnapshotRow,
} from "./report-parts"

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
    return <FailedState message={error} />
  }

  if (!audit || audit.status === "processing") {
    return <ProcessingState />
  }

  if (audit.status === "failed") {
    return <FailedState message={audit.error_message || audit.analysis?.error} />
  }

  return <CompleteReport audit={audit} />
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
  const isA16zReport = isAndreessenHorowitzReport(audit, companyName, domain)
  const sampleEmail = isA16zReport ? A16Z_CORRECTED_EMAIL : audit.sample_email ?? analysis.sample_email ?? {}
  const displayedGtmPlan = isA16zReport ? replacePlanEmailPov(audit.gtm_plan) : audit.gtm_plan
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
                  href="/demo"
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
            {isA16zReport && (
              <CorrectionNote>
                [NOTE: Section 6 email sample rewritten to use a16z → founder POV.]
              </CorrectionNote>
            )}
            <div className="grid gap-5 lg:grid-cols-3">
              <PlanColumn title="Week 1 — Foundation" items={displayedGtmPlan?.week_1} />
              <PlanColumn title="Week 2-3 — Outreach" items={displayedGtmPlan?.week_2_3} />
              <PlanColumn title="Week 4 — Optimize" items={displayedGtmPlan?.week_4} />
            </div>
            {isA16zReport && (
              <div className="mt-5 border border-[#FF6B35]/30 bg-[#FF6B35]/[0.05] p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#FF6B35]">
                  Corrected outbound sample
                </p>
                <p className="mt-3 text-sm leading-7 text-white/76">{A16Z_CORRECTED_EMAIL.body}</p>
              </div>
            )}
          </ReportSection>

          <ReportSection eyebrow="Section 7" title="What Hubbly would send on your behalf">
            {isA16zReport && (
              <CorrectionNote>
                [NOTE: Section 7 email rewritten from founder → a16z POV to a16z → founder POV.]
              </CorrectionNote>
            )}
            <div className="mx-auto max-w-3xl bg-white p-6 text-[#0A0A0A] shadow-2xl md:p-8">
              <div className="grid gap-2 border-b border-black/10 pb-4 font-mono text-xs">
                <p>
                  <span className="text-black/45">From:</span>{" "}
                  {isA16zReport ? "American Dynamism at Andreessen Horowitz (via Hubbly OS)" : "Hubbly OS"}
                </p>
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
                href="/demo"
                className="inline-flex min-h-12 items-center justify-center bg-[#FF6B35] px-6 font-mono text-xs uppercase tracking-widest text-[#0A0A0A] transition-opacity duration-200 hover:opacity-90"
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
