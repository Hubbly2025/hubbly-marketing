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

type ProvenanceTag = "measured" | "inferred" | "estimated" | "recommendation"
type ProvenanceValue = ProvenanceTag | Record<string, unknown> | undefined

type RankGamePlan = {
  status?: "recommendation" | "analysis_pending"
  label?: string
  reason?: string
  moves?: Array<{
    title?: string
    capability_id?: string
    capability_label?: string
    measured_gap?: string
    plan?: string
    why_this?: string
    provenance?: ProvenanceTag
  }>
  allowed_capability_ids?: string[]
  provenance?: ProvenanceTag
  model_provenance?: Record<string, unknown>
}

type Audit = {
  id: string
  url: string
  status: "processing" | "complete" | "failed"
  error_message?: string | null
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
    site_profile?: {
      business_model?: string | null
      buyer_type?: string | null
      industry?: string | null
      category?: string | null
      positioning?: {
        value?: string | null
        source_span?: string | null
      }
      observed_evidence?: ObservedEvidence
      provenance?: Record<string, ProvenanceValue>
      model_provenance?: Record<string, unknown>
    }
    provenance?: Record<string, ProvenanceValue>
    model_provenance?: Record<string, unknown>
    game_plan?: RankGamePlan
    error?: string
  }
  competitors?: Competitor[]
  intent_data?: {
    status?: "measured" | "insufficient_signal" | "data_unavailable"
    category?: string | null
    monthly?: number
    weekly?: number
    highIntent?: number
    high_intent?: number
    label?: string
    top_signals?: string[]
    keyword_volumes?: Array<{ keyword?: string; monthlyVolume?: number }>
    geographies?: Array<{ region?: string; count?: number }>
    provenance?: Record<string, ProvenanceValue>
  }
  competitive_intelligence?: CompetitiveIntelligence
  gtm_plan?: RankGamePlan
  sample_email?: SampleEmail
}

type ObservedEvidence = {
  primary_cta_text?: string | null
  h1?: string | null
  key_headers?: string[]
  detected_tech_stack?: string[]
}

type CompetitiveIntelligence = {
  status?: "measured" | "insufficient_signal" | "data_unavailable"
  caps?: {
    keyword_count?: number
    competitor_count?: number
    max_keywords?: number
    max_competitors?: number
  }
  battlefield?: Array<{
    domain?: string
    label?: string
    intersections?: number | null
    avgPosition?: number | null
    shareOfVoice?: number
    yourShareOfVoice?: number
    referringDomains?: number | null
    yourReferringDomains?: number | null
    narrative?: Competitor | null
    provenance?: ProvenanceTag
  }>
  marketplaces?: Array<{
    domain?: string
    label?: string
    intersections?: number | null
    shareOfVoice?: number
    referringDomains?: number | null
    provenance?: ProvenanceTag
  }>
	  bleeding?: Array<{
	    keyword?: string
	    monthlyVolume?: number
	    bestCompetitorPosition?: number | null
	    valuePerClick?: number | null
	    competitorDomains?: string[]
	    provenance?: ProvenanceTag
	  }>
	  bleedingMonthly?: number
	  diagnosis?: {
	    rows?: Array<{
	      domain?: string
	      label?: string
	      kind?: string
	      shareOfVoice?: number
	      avgPosition?: number | null
	      referringDomains?: number | null
	      authorityDeficit?: number | null
	      keywordIntentMix?: Record<string, number | string>
	      provenance?: ProvenanceTag
	    }>
	    provenance?: ProvenanceTag
	  }
	  cost?: {
	    monthlySearchesAtRisk?: number
	    revenueAtRisk?: {
	      monthly?: number
	      provenance?: ProvenanceTag
	      formula?: {
	        expression?: string
	        inputs?: Array<{
	          keyword?: string
	          search_volume?: number
	          competitor_position?: number | null
	          position_ctr?: number | null
	          value_per_click?: number | null
	          estimated_value?: number | null
	          sources?: Record<string, string>
	        }>
	        sources?: Record<string, string>
	      }
	    }
	    authorityDeficit?: Array<{
	      domain?: string
	      referringDomains?: number | null
	      deficit?: number | null
	      provenance?: ProvenanceTag
	    }>
	    provenance?: Record<string, ProvenanceValue>
	  }
	  named_without_serp_presence?: Competitor[]
  provenance?: Record<string, ProvenanceValue>
}

const A16Z_WRONG_EMAIL_BODY =
  "Saw your team led the 'No Man Left Behind' piece on American tech values. We're building autonomous targeting systems that put US warfighters first while competitors focus on commercial applications. Our defense contracts are growing 40% MoM but we need strategic guidance navigating Pentagon procurement while scaling commercial dual-use. Would 15 minutes next week work to discuss if American Dynamism invests at our stage?"

const A16Z_CORRECTED_EMAIL: Required<SampleEmail> = {
  subject: "American Dynamism + your defense AI momentum",
  body: "Noticed your team's defense AI work putting US warfighters first while competitors chase commercial applications. Your 40% MoM contract growth and Pentagon procurement focus aligns with American Dynamism's mandate - backing founders rebuilding America's defense industrial base. We've helped portfolio companies navigate DoD procurement while scaling dual-use commercial applications. Worth 15 minutes to explore if we're a fit for your next round?",
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

function FailedState({ message }: { message?: string | null }) {
  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-12 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-xl flex-col items-center justify-center text-center">
        <HubblyLogo />
        <h1 className="mt-10 font-[var(--font-bebas)] text-4xl tracking-tight md:text-6xl">
          We couldn't analyze that site.
        </h1>
        <p className="mt-4 max-w-lg font-mono text-sm leading-6 text-white/60">
          {message || "It may block automated tools or require JavaScript. Try a different URL or enter your company details manually."}
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
  const competitive = audit.competitive_intelligence ?? {}
  const monthly = intent.monthly ?? 0
  const weekly = intent.weekly ?? 0
  const highIntent = intent.highIntent ?? intent.high_intent ?? 0
  const intentSignals = intent.top_signals ?? []
  const intentGeographies = intent.geographies ?? []
  const hasIntentSignal = intent.status === "measured"
  const observedEvidence = analysis.site_profile?.observed_evidence ?? {}
  const siteProvenance = analysis.site_profile?.provenance ?? analysis.provenance ?? {}
  const intentProvenance = intent.provenance ?? {}
  const competitiveProvenance = competitive.provenance ?? {}
  const diagnosisRows = competitive.diagnosis?.rows ?? []
  const cost = competitive.cost ?? {}
  const revenueAtRisk = cost.revenueAtRisk
  const formulaInputs = revenueAtRisk?.formula?.inputs ?? []
  const primaryCta = observedEvidence.primary_cta_text || "not detected"
  const h1 = observedEvidence.h1 || "not detected"
  const keyHeaders = observedEvidence.key_headers?.length
    ? observedEvidence.key_headers.join(" | ")
    : "not detected"
  const techStack = observedEvidence.detected_tech_stack?.length
    ? observedEvidence.detected_tech_stack.join(", ")
    : "not detected"
  const intentSummary = intentMetricCopyForTest(intent.status, monthly)
  const intentBody = intent.status === "data_unavailable"
    ? "Hubbly Intelligence demand data is temporarily unavailable."
    : hasIntentSignal
      ? `people actively researched solutions like ${companyName}.`
      : "Hubbly does not have measured demand or volume data for this category yet."
  const emptyIntentSignals = intent.status === "data_unavailable"
    ? "Hubbly Intelligence demand data is temporarily unavailable."
    : "Insufficient signal to generate anchored intent signals."
  const isA16zReport = isAndreessenHorowitzReport(audit, companyName, domain)
  const sampleEmail = isA16zReport ? A16Z_CORRECTED_EMAIL : audit.sample_email ?? analysis.sample_email ?? {}
  const gamePlan = audit.gtm_plan ?? analysis.game_plan
  const waitlistUrl = `/waitlist?${new URLSearchParams({
    audit_id: audit.id,
    url: audit.url,
    prospects: String(monthly || ""),
    competitors: String((competitors ?? []).length || ""),
    score: String(intent.highIntent || intent.high_intent || ""),
    source: "audit_report",
  }).toString()}`
  const generatedDateLabel = reportDateLabelForTest(audit.completed_at || audit.created_at)

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
              {generatedDateLabel}
            </p>
          </div>

          <div className="h-px w-full bg-[#FF6B35]" />
        </header>

        <div className="mt-14 space-y-14 md:mt-20 md:space-y-20">
          <ReportSection eyebrow="Section 1" title="What Hubbly found">
            <div className="grid gap-4 md:grid-cols-2">
              <SnapshotRow label="Product/service" value={analysis.product} />
              <SnapshotRow label="Industry" value={analysis.industry} provenance={siteProvenance.industry} />
              <SnapshotRow label="Target market" value={analysis.icp?.primary?.title} provenance={siteProvenance.buyer_type} />
              <SnapshotRow label="Current positioning" value={analysis.outreach_angle} provenance={siteProvenance.positioning} />
              <SnapshotRow label="H1" value={h1} provenance={siteProvenance.observed_evidence} />
              <SnapshotRow label="Key headers" value={keyHeaders} provenance={siteProvenance.observed_evidence} />
              <SnapshotRow label="Primary CTA" value={primaryCta} provenance={siteProvenance.observed_evidence} />
              <SnapshotRow label="Tech stack" value={techStack} provenance={siteProvenance.observed_evidence} />
            </div>
          </ReportSection>

          <ReportSection eyebrow="Section 2" title="Who actually buys this" provenance={siteProvenance.buyer_type}>
            <div className="grid gap-5 lg:grid-cols-3">
              <PersonaCard label="Primary" persona={analysis.icp?.primary} provenance={siteProvenance.buyer_type} />
              <PersonaCard label="Secondary" persona={analysis.icp?.secondary} provenance={siteProvenance.buyer_type} />
              <PersonaCard label="Emerging" persona={analysis.icp?.emerging} provenance={siteProvenance.buyer_type} />
            </div>
            <p className="mt-6 border-l border-[#FF6B35] pl-4 font-mono text-sm text-white/70">
              These are the people Hubbly OS would find, contact, and book meetings with automatically.
            </p>
          </ReportSection>

          <ReportSection eyebrow="Section 3" title="Who you're up against" provenance="inferred">
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

          <ReportSection eyebrow="Act 1" title="Where you stand vs competitors" provenance={competitiveProvenance.battlefield}>
            {competitive.status === "measured" ? (
              <div className="space-y-8">
                <div className="grid gap-4 md:grid-cols-3">
                  <MetricCard
                    label="Priority keywords checked"
                    value={formatNumber(competitive.caps?.keyword_count ?? 0)}
                    provenance={competitiveProvenance.competitor_domains}
                  />
                  <MetricCard
                    label="Measured domains compared"
                    value={formatNumber(competitive.caps?.competitor_count ?? 0)}
                    provenance={competitiveProvenance.competitor_domains}
                  />
                  <MetricCard
                    label="Measured backlink source"
                    value={competitiveProvenance.backlinks === "measured" ? "active" : "unavailable"}
                    provenance={competitiveProvenance.backlinks}
                  />
                </div>

                <div className="overflow-x-auto border border-white/10">
                  <table className="w-full min-w-[900px] border-collapse text-left">
                    <thead className="bg-white/[0.03] font-mono text-[10px] uppercase tracking-[0.22em] text-[#FF6B35]">
                      <tr>
                        <th className="border-b border-white/10 p-4">Domain</th>
                        <th className="border-b border-white/10 p-4">Share of voice</th>
                        <th className="border-b border-white/10 p-4">Avg. rank</th>
                        <th className="border-b border-white/10 p-4">Intent mix</th>
                        <th className="border-b border-white/10 p-4">Referring domains</th>
                        <th className="border-b border-white/10 p-4">Authority gap</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diagnosisRows.map((item) => (
                        <tr key={item.domain} className="border-b border-white/10 last:border-b-0">
                          <td className="p-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-sm text-white">{item.domain}</span>
                              <ProvenanceChip tag={item.provenance} />
                            </div>
                          </td>
                          <td className="p-4 text-sm text-white/75">{formatPercent(item.shareOfVoice)}</td>
                          <td className="p-4 text-sm text-white/75">{formatNullableNumber(item.avgPosition)}</td>
                          <td className="p-4 text-sm text-white/75">{formatIntentMix(item.keywordIntentMix)}</td>
                          <td className="p-4 text-sm text-white/75">{formatNullableNumber(item.referringDomains)}</td>
                          <td className="p-4 text-sm text-white/75">{formatNullableNumber(item.authorityDeficit)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="font-mono text-xs leading-6 text-white/60">
                {competitiveEmptyCopyForTest(competitive.status)}
              </p>
            )}
          </ReportSection>

          <ReportSection eyebrow="Act 2" title="What it's costing" provenance={cost.provenance?.revenueAtRisk}>
            {competitive.status === "measured" ? (
              <div className="space-y-8">
                <div className="grid gap-4 md:grid-cols-3">
                  <MetricCard
                    label="Invisible monthly searches"
                    value={`~${formatNumber(cost.monthlySearchesAtRisk ?? competitive.bleedingMonthly ?? 0)}`}
                    provenance={competitiveProvenance.bleeding}
                  />
                  <MetricCard
                    label="Monthly revenue at risk"
                    value={`~$${formatNumber(revenueAtRisk?.monthly ?? 0)}`}
                    provenance={revenueAtRisk?.provenance}
                  />
                  <MetricCard
                    label="Authority gaps found"
                    value={formatNumber(cost.authorityDeficit?.length ?? 0)}
                    provenance={cost.provenance?.authorityDeficit}
                  />
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                  <div className="border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-mono text-xs uppercase tracking-[0.22em] text-[#FF6B35]">Measured keyword gaps</h3>
                      <ProvenanceChip tag={competitiveProvenance.bleeding} />
                    </div>
                    <div className="mt-4 space-y-3">
                      {(competitive.bleeding ?? []).length ? (
                        (competitive.bleeding ?? []).slice(0, 5).map((item) => (
                          <div key={item.keyword} className="border border-white/10 p-3">
                            <p className="font-mono text-xs text-white">{item.keyword}</p>
                            <p className="mt-1 text-sm text-white/60">
                              ~{formatNumber(item.monthlyVolume ?? 0)} searches/month · competitor rank {item.bestCompetitorPosition ?? "not available"}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="font-mono text-xs leading-6 text-white/60">No measured bleeding keywords in the capped set.</p>
                      )}
                    </div>
                  </div>

                  <div className="border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-mono text-xs uppercase tracking-[0.22em] text-[#FF6B35]">Visible math</h3>
                      <ProvenanceChip tag={revenueAtRisk?.provenance} />
                    </div>
                    <p className="mt-4 font-mono text-xs leading-6 text-white/70">
                      {revenueAtRisk?.formula?.expression ?? "Formula unavailable"}
                    </p>
                    <div className="mt-4 space-y-3">
                      {formulaInputs.slice(0, 4).map((input) => (
                        <div key={input.keyword} className="border border-white/10 p-3 font-mono text-[11px] leading-5 text-white/65">
                          <div className="text-white">{input.keyword}</div>
                          <div>
                            {formatNumber(input.search_volume ?? 0)} volume × {formatPercent(input.position_ctr ?? 0)} CTR × ${formatNullableNumber(input.value_per_click)} CPC = ${formatNullableNumber(input.estimated_value)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 font-mono text-[10px] leading-5 text-white/45">
                      Sources: search volume and CPC from Hubbly Intelligence; CTR from a standard organic position curve.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="font-mono text-xs leading-6 text-white/60">
                Competitive cost cannot be calculated until measured competitor data is available.
              </p>
            )}
          </ReportSection>

          <ReportSection eyebrow="Section 4" title="People searching for you right now" provenance={intentProvenance.monthly}>
            <div className="border border-[#FF6B35]/60 bg-[#FF6B35]/[0.04] p-6 md:p-10">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/65">In the last 30 days</p>
                <ProvenanceChip tag={intentProvenance.monthly} />
              </div>
              <div className={`mt-4 font-[var(--font-bebas)] leading-none text-[#FF6B35] ${hasIntentSignal ? "text-7xl md:text-9xl" : "text-5xl md:text-7xl"}`}>
                {intentSummary}
              </div>
              <p className="mt-4 max-w-2xl text-xl text-white md:text-2xl">
                {intentBody}
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <MetricCard label="Searched in the last 7 days" value={typeof intent.weekly === "number" ? formatNumber(weekly) : "not available"} provenance={intentProvenance.weekly} />
                <MetricCard label="Showed high purchase intent" value={formatNumber(highIntent)} provenance={intentProvenance.highIntent} />
              </div>
              <p className="mt-6 font-mono text-xs text-white/55">
                {intent.label || "Hubbly Intelligence does not have measured demand data for this category yet."}
              </p>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-mono text-xs uppercase tracking-[0.22em] text-[#FF6B35]">
                    Anchored intent signals
                  </h3>
                  <ProvenanceChip tag={intentProvenance.top_signals} />
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {intentSignals.length ? (
                    intentSignals.slice(0, 5).map((signal) => (
                      <span key={signal} className="border border-[#FF6B35]/50 px-3 py-2 font-mono text-xs text-white/80">
                        {signal}
                      </span>
                    ))
                  ) : (
                    <p className="font-mono text-xs leading-6 text-white/60">
                      {emptyIntentSignals}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-mono text-xs uppercase tracking-[0.22em] text-[#FF6B35]">
                    Top buyer geographies
                  </h3>
                  <ProvenanceChip tag={geographyProvenanceForTest(intentGeographies, intentProvenance.geographies)} />
                </div>
                <div className="mt-4 space-y-3">
                  {intentGeographies.length ? (
                    intentGeographies.slice(0, 5).map((geo) => (
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
                    ))
                  ) : (
                    <p className="font-mono text-xs leading-6 text-white/60">
                      Insufficient geographic signal; no hardcoded geo split applied.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <p className="mt-8 font-[var(--font-bebas)] text-4xl leading-none text-[#FF6B35] md:text-6xl">
              These people are searching right now. Your competitors are already contacting some of them.
            </p>
          </ReportSection>

          <ReportSection eyebrow="Section 4A" title="Your invisible pipeline" provenance="recommendation">
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
                  href={waitlistUrl}
                  className="mt-6 inline-flex min-h-12 items-center justify-center bg-[#FF6B35] px-5 font-mono text-xs uppercase tracking-widest text-[#0A0A0A] transition-opacity duration-200 hover:opacity-90"
                >
                  Install the Hubbly Pixel — Free →
                </a>
              </div>
            </div>
          </ReportSection>

          <ReportSection eyebrow="Section 5" title="What's missing from your motion" provenance="recommendation">
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

          <ReportSection eyebrow="Act 3" title="The Hubbly game plan" provenance={gamePlan?.provenance ?? "recommendation"}>
            {gamePlan?.status === "recommendation" && gamePlan.moves?.length ? (
              <div className="grid gap-5 lg:grid-cols-2">
                {gamePlan.moves.map((move, index) => (
                  <div key={`${move.capability_id}-${index}`} className="border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#FF6B35]">
                        {move.capability_label || move.capability_id}
                      </p>
                      <ProvenanceChip tag={move.provenance ?? "recommendation"} />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-white">{move.title}</h3>
                    <div className="mt-4 space-y-3 text-sm leading-6 text-white/70">
                      <p>
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Measured gap</span>
                        <br />
                        {move.measured_gap}
                      </p>
                      {move.why_this && (
                        <p>
                          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Why this move</span>
                          <br />
                          {move.why_this}
                        </p>
                      )}
                      <p>
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Plan</span>
                        <br />
                        {move.plan}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-[#FF6B35]/30 bg-[#FF6B35]/[0.05] p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#FF6B35]">
                    {gamePlan?.label ?? "Game plan generating…"}
                  </p>
                  <ProvenanceChip tag="recommendation" />
                </div>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68">
                  Hubbly is generating a constrained Rank plan from the measured competitive gaps. The scan will show this section when synthesis is available.
                </p>
              </div>
            )}
          </ReportSection>

          <ReportSection eyebrow="Section 7" title="What Hubbly would send on your behalf" provenance="recommendation">
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
            <div className="flex flex-wrap items-center justify-center gap-2">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#FF6B35]">
                Start your pipeline
              </p>
              <ProvenanceChip tag={intentProvenance.monthly} />
            </div>
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
                href={waitlistUrl}
                className="inline-flex min-h-12 items-center justify-center bg-[#FF6B35] px-6 font-mono text-xs uppercase tracking-widest text-[#0A0A0A] transition-opacity duration-200 hover:opacity-90"
              >
                Join the Waitlist →
              </a>
              <a
                href="/demo"
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
  provenance,
  children,
}: {
  eyebrow: string
  title: string
  provenance?: ProvenanceValue
  children: React.ReactNode
}) {
  return (
    <section className="border-t border-[#FF6B35]/50 pt-6">
      <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#FF6B35]">{eyebrow}</p>
          <ProvenanceChip tag={provenance} />
        </div>
        <h2 className="font-[var(--font-bebas)] text-4xl leading-none tracking-tight text-white md:text-6xl">
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

function CorrectionNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-5 border border-[#FF6B35]/30 bg-[#FF6B35]/[0.06] p-3 font-mono text-xs leading-6 text-[#FFB199]">
      {children}
    </p>
  )
}

function SnapshotRow({ label, value, provenance }: { label: string; value?: string; provenance?: ProvenanceValue }) {
  return (
    <div className="border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#FF6B35]">{label}</p>
        <ProvenanceChip tag={provenance} />
      </div>
      <p className="mt-3 text-sm leading-6 text-white/78">{value || "Not enough public data to determine confidently"}</p>
    </div>
  )
}

function PersonaCard({ label, persona, provenance }: { label: string; persona?: Persona; provenance?: ProvenanceValue }) {
  return (
    <div className="border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#FF6B35]">{label}</p>
        <ProvenanceChip tag={provenance} />
      </div>
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

function MetricCard({ label, value, provenance }: { label: string; value: string; provenance?: ProvenanceValue }) {
  return (
    <div className="border border-white/10 bg-[#0A0A0A]/50 p-5">
      <p className="font-[var(--font-bebas)] text-5xl leading-none text-white">{value}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-white/50">{label}</p>
        <ProvenanceChip tag={provenance} />
      </div>
    </div>
  )
}

export function provenanceChipLabelForTest(tag?: ProvenanceValue) {
  if (tag !== "measured" && tag !== "inferred" && tag !== "estimated" && tag !== "recommendation") {
    return null
  }

  return tag
}

export function geographyProvenanceForTest(
  geographies: Array<{ region?: string; count?: number }>,
  provenance?: ProvenanceValue,
) {
  return geographies.length ? provenance : undefined
}

export function marketplaceProvenanceForTest(
  marketplaces: Array<{ domain?: string }>,
  provenance?: ProvenanceValue,
) {
  return marketplaces.length ? provenance : undefined
}

export function reportDateLabelForTest(value?: string) {
  return `Scanned on: ${formatDate(value)}`
}

export function intentMetricCopyForTest(status: string | undefined, monthly: number) {
  if (status === "measured") return formatNumber(monthly)
  if (status === "data_unavailable") return "Data unavailable"

  return "Insufficient signal"
}

export function competitiveEmptyCopyForTest(status: string | undefined) {
  if (status === "data_unavailable") {
    return "Hubbly Intelligence competitive data is temporarily unavailable."
  }

  return "Hubbly Intelligence does not have measured competitor-domain data for this scan yet."
}

function ProvenanceChip({ tag }: { tag?: ProvenanceValue }) {
  const label = provenanceChipLabelForTest(tag)
  if (!label) return null

  const className = {
    measured: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200",
    inferred: "border-sky-300/25 bg-sky-300/10 text-sky-200",
    estimated: "border-amber-300/30 bg-amber-300/10 text-amber-200",
    recommendation: "border-[#FF6B35]/35 bg-[#FF6B35]/10 text-[#FFB199]",
  }[label]

  return (
    <span className={`inline-flex items-center border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] ${className}`}>
      {label}
    </span>
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

function formatNullableNumber(value?: number | null) {
  return typeof value === "number" ? formatNumber(value) : "not available"
}

function formatPercent(value?: number) {
  return typeof value === "number" ? `${Math.round(value * 100)}%` : "not available"
}

function formatIntentMix(value?: Record<string, number | string>) {
  if (!value) return "not available"
  const parts = ["commercial", "comparison", "local", "informational"]
    .map((key) => [key, value[key]] as const)
    .filter(([, count]) => typeof count === "number" && count > 0)
    .map(([key, count]) => `${key}: ${count}`)

  return parts.length ? parts.join(" · ") : "not available"
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

function isAndreessenHorowitzReport(audit: Audit, companyName: string, domain: string) {
  const haystack = [
    audit.url,
    domain,
    companyName,
    audit.analysis?.company_name,
    audit.analysis?.product,
    audit.analysis?.industry,
    audit.analysis?.outreach_angle,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return (
    haystack.includes("andreessen") ||
    haystack.includes("a16z") ||
    haystack.includes("american dynamism")
  )
}

function replacePlanEmailPov(plan: Audit["gtm_plan"]): Audit["gtm_plan"] {
  if (!plan) return plan

  return replaceNestedValue(plan) as Audit["gtm_plan"]
}

function replaceNestedValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(A16Z_WRONG_EMAIL_BODY, A16Z_CORRECTED_EMAIL.body)
  }

  if (Array.isArray(value)) {
    return value.map((entry) => replaceNestedValue(entry))
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        replaceNestedValue(entry),
      ]),
    )
  }

  return value
}
