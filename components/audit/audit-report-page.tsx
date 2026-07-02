"use client"

import { useEffect, useMemo, useState } from "react"
import type { Audit } from "./types"
import { formatDate, formatNumber, getDomain } from "./audit-utils"
import {
  FailedState,
  HubblyLogo,
  MetricCard,
  PersonaCard,
  ProcessingState,
  ReportSection,
  SnapshotRow,
} from "./report-parts"
import { SeoSection } from "./seo-section"
import type { SeoReport } from "@/lib/seo-report/types"

// Single CTA everywhere — the report is a sales letter with one action.
// /start is the live self-serve trial form (posts to the existing waitlist
// API). TODO(stripe): swap CTA_HREF to the Stripe Checkout link once the
// Autopilot product + price exist in Stripe; the /start form stays as the
// no-Stripe fallback.
const CTA_LABEL = "Start my 14-day trial"
const CTA_HREF = "/start"

// Provenance chip used on every rendered number so the report reads as
// measured/estimated/modeled/recommendation, never marketing.
type ProvenanceKind = "measured" | "estimated" | "modeled" | "recommendation"

function ProvenanceChip({ kind }: { kind: ProvenanceKind }) {
  const label =
    kind === "measured"
      ? "Measured · Hubbly"
      : kind === "estimated"
        ? "Estimate · Hubbly Data benchmarks"
        : kind === "modeled"
          ? "Modeled · Hubbly"
          : "Recommendation"
  return (
    <span className="inline-flex font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
      {label}
    </span>
  )
}

// Real commercial terms measured for THIS site. Falls back to strength-claim
// quoted phrases when no gap keywords are present. Returns [] when neither is
// available — the caller omits the row rather than shipping template chips
// like "best finance for growing teams" that instantly falsify a gold-dealer
// report.
function buildMeasuredIntentTerms(seo: SeoReport | undefined): string[] {
  if (!seo) return []
  const gaps = (seo.gapKeywords ?? []).map((g) => g.keyword).filter(Boolean)
  if (gaps.length) return gaps.slice(0, 5)
  const quoted = (seo.strengths ?? [])
    .map((s) => s.claim.match(/[""]([^""]+)[""]/) || s.claim.match(/"([^"]+)"/))
    .filter((m): m is RegExpMatchArray => Boolean(m))
    .map((m) => m[1])
  return quoted.slice(0, 5)
}

// Competitor fields are all optional strings — never render the literal
// "Weakness unavailable" placeholder to a customer; em-dash reads as "not
// stated" without pretending we ran a check that came up empty.
function fieldOrDash(value: string | undefined): string {
  return value && value.trim() ? value : "—"
}

// Above-the-fold verdict. Three measured/modeled numbers under one headline.
// Deliberately NO CTA here — the sales arc doesn't ask for the order before
// the pain is agitated; the only action above the fold is the scroll cue into
// the diagnosis. Slot 2 auto-upgrades from searches/mo to revenue-at-risk $
// when the field ships; Slot 3 shows "not yet measured" until the AI citation
// count lands.
function VerdictHero({
  companyName,
  monthly,
  gapVolumeMonthly,
  revenueAtRisk,
  aiCitations,
  industry,
}: {
  companyName: string
  monthly: number
  gapVolumeMonthly: number
  revenueAtRisk?: number
  aiCitations?: number
  industry?: string
}) {
  const hasRevenue = typeof revenueAtRisk === "number" && revenueAtRisk > 0
  const hasCitations = typeof aiCitations === "number"
  const slot2Value = hasRevenue
    ? `$${Math.round(revenueAtRisk!).toLocaleString()}/mo`
    : gapVolumeMonthly > 0
      ? `${formatNumber(gapVolumeMonthly)}/mo`
      : "—"
  const slot2Label = hasRevenue
    ? "Revenue flowing to competitors"
    : "Searches flowing to competitors"
  const slot3Value = hasCitations ? formatNumber(aiCitations!) : "Not yet measured"
  return (
    <section className="mt-10 border border-[#FF6B35]/70 bg-[#FF6B35]/[0.06] p-6 md:mt-14 md:p-12">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#FF6B35]">
        The verdict
      </p>
      <h2 className="mt-4 max-w-4xl font-[var(--font-bebas)] text-4xl leading-[1.05] tracking-tight md:text-6xl">
        Buyers are searching for what {companyName} sells. The demand is going somewhere else.
      </h2>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="border border-white/10 bg-[#0A0A0A]/50 p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/55">
            Buyers searching now
          </p>
          <p className="mt-3 font-[var(--font-bebas)] text-5xl leading-none text-[#FF6B35] md:text-6xl">
            {formatNumber(monthly)}
          </p>
          <p className="mt-2 text-xs text-white/65">
            in the last 30 days across {industry || "this category"}
          </p>
          <div className="mt-3">
            <ProvenanceChip kind="estimated" />
          </div>
        </div>

        <div className="border border-white/10 bg-[#0A0A0A]/50 p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/55">
            {slot2Label}
          </p>
          <p className="mt-3 font-[var(--font-bebas)] text-5xl leading-none text-[#FF6B35] md:text-6xl">
            {slot2Value}
          </p>
          <p className="mt-2 text-xs text-white/65">
            {hasRevenue
              ? "modeled from measured gap volume × category CPC × commercial CTR"
              : gapVolumeMonthly > 0
                ? "measured commercial keywords where competitors rank and you don't"
                : "no measured commercial gaps in this sample"}
          </p>
          <div className="mt-3">
            <ProvenanceChip kind={hasRevenue ? "modeled" : "measured"} />
          </div>
        </div>

        <div className="border border-white/10 bg-[#0A0A0A]/50 p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/55">
            AI-search citations
          </p>
          <p className="mt-3 font-[var(--font-bebas)] text-5xl leading-none text-[#FF6B35] md:text-6xl">
            {slot3Value}
          </p>
          <p className="mt-2 text-xs text-white/65">
            {hasCitations
              ? "times an AI answer engine cited your domain in the sample"
              : "AI-engine citation sampling ships next — the slot is wired"}
          </p>
          <div className="mt-3">
            <ProvenanceChip kind={hasCitations ? "measured" : "recommendation"} />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <a
          href="#diagnosis"
          onClick={(event) => {
            event.preventDefault()
            document.getElementById("diagnosis")?.scrollIntoView({ behavior: "smooth" })
          }}
          className="inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.22em] text-[#FF6B35] transition-opacity duration-200 hover:opacity-80"
        >
          See exactly where it's going — and what it costs you ↓
        </a>
      </div>
    </section>
  )
}

// C5 value bridge — the treatment chain. Every step is a mechanism claim
// (what Autopilot DOES), never a revenue/ranking/timeline promise. When gap
// keywords exist, the chain names them and the top competitor so the reader
// sees their own report threaded through the vehicle; otherwise it degrades
// to honest category-level copy — never invented keywords, never skipped.
function buildBridgeSteps({
  gapKeywords,
  topGapCompetitor,
  industry,
  companyName,
}: {
  gapKeywords: string[]
  topGapCompetitor: string
  industry?: string
  companyName: string
}): Array<{ step: string; copy: string }> {
  const kw1 = gapKeywords[0]
  const kw2 = gapKeywords[1]
  const targetCopy = kw1
    ? `Starts with the measured gaps above — "${kw1}"${kw2 ? `, "${kw2}"` : ""}${
        topGapCompetitor ? ` and the rest of the list ${topGapCompetitor} captures today` : ""
      } — highest measured volume first. No guessed topics.`
    : `No measured gap keywords in this sample, so it starts at the category level: the core commercial pages ${
        industry || "this market"
      } buyers actually search for — measured before anything is written.`
  return [
    { step: "Target", copy: targetCopy },
    {
      step: "Write",
      copy: `Drafts each page server-rendered and fact-checks every claim against ${companyName}'s own site. A claim that can't be verified doesn't ship.`,
    },
    {
      step: "Publish",
      copy: "Ships through approval-gated publish rails to your CMS, on your domain. You see every page before it goes live, and you keep them all.",
    },
    {
      step: "Verify",
      copy: "Re-reads the live page after publishing — permalink, canonical, schema. Anything off and it fails loudly and stops. No silent half-publishes.",
    },
    {
      step: "Measure",
      copy: "Tracks every published page with the same measurement engine that built this report — rank data today, AI-engine citations as that sampling ships.",
    },
    {
      step: "Compound",
      copy: "Runs the loop weekly. Each cycle re-measures the gap list and targets what's still open — the same compounding motion your competitors currently point at you.",
    },
  ]
}

function ValueBridge({
  eyebrow,
  companyName,
  gapKeywords,
  topGapCompetitor,
  industry,
}: {
  eyebrow: string
  companyName: string
  gapKeywords: string[]
  topGapCompetitor: string
  industry?: string
}) {
  const steps = buildBridgeSteps({ gapKeywords, topGapCompetitor, industry, companyName })
  return (
    <ReportSection eyebrow={eyebrow} title="The treatment">
      <p className="max-w-3xl text-xl leading-9 text-white md:text-2xl">
        Everything above is the diagnosis. Here's the treatment — specifically for {companyName}.
      </p>

      <div className="mt-8 divide-y divide-white/10 border border-white/10 bg-white/[0.02]">
        {steps.map((item, index) => (
          <div
            key={item.step}
            className="grid gap-3 p-5 md:grid-cols-[180px_1fr] md:gap-6 md:p-6"
          >
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                Step {index + 1}
              </p>
              <p className="mt-1 font-[var(--font-bebas)] text-3xl leading-none text-[#FF6B35]">
                {item.step}
              </p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/55">
                What Autopilot does
              </p>
              <p className="mt-2 text-sm leading-7 text-white/78">{item.copy}</p>
              <div className="mt-3">
                <ProvenanceChip kind="recommendation" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 border border-[#FF6B35]/40 bg-[#FF6B35]/[0.04] p-5 md:p-6">
        <p className="font-mono text-sm leading-7 text-white">
          This entire report was measured live by the same engine, in about two minutes, from
          nothing but a URL. That was the demo.
        </p>
        <div className="mt-3">
          <ProvenanceChip kind="measured" />
        </div>
      </div>
    </ReportSection>
  )
}

// C6 offer stack + close. Anchor pricing is a market-price comparison, not a
// discount gimmick — real agency/DIY numbers a buyer can verify. One CTA.
const OFFER_STACK: Array<{ name: string; detail: string }> = [
  {
    name: "Rank SEO agent",
    detail: "Plans, writes, and publishes measured pages against your gap keywords, weekly.",
  },
  {
    name: "Honesty gate",
    detail:
      "Every claim fact-checked against your own site before publishing. Pages that fail don't ship.",
  },
  {
    name: "Publish rails",
    detail: "Approval-gated publishing straight to your CMS. Your domain, your pages, your control.",
  },
  {
    name: "AI citation tracking",
    detail: "Measures when AI answer engines cite your domain — the layer search is moving to.",
  },
  {
    name: "Search intent engine",
    detail: "The measurement layer that built this report, running continuously on your market.",
  },
  {
    name: "Hubbly pixel — included",
    detail: "Identifies anonymous visitors on your site. Installs during onboarding, after you start.",
  },
]

function OfferClose({ companyName }: { companyName: string }) {
  return (
    <section id="offer" className="scroll-mt-8 border border-[#FF6B35]/70 bg-[#FF6B35]/[0.06] p-6 md:p-12">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#FF6B35]">The offer</p>
      <h2 className="mt-5 max-w-4xl font-[var(--font-bebas)] text-5xl leading-none tracking-tight md:text-7xl">
        Everything Autopilot runs for {companyName}
      </h2>

      <div className="mt-8 divide-y divide-white/10 border border-white/10 bg-[#0A0A0A]/60">
        {OFFER_STACK.map((row) => (
          <div key={row.name} className="grid gap-2 p-5 md:grid-cols-[260px_1fr] md:gap-6">
            <p className="font-mono text-sm text-white">{row.name}</p>
            <p className="text-sm leading-7 text-white/70">{row.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="border border-white/10 bg-[#0A0A0A]/60 p-5 md:p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
            Market-price comparison
          </p>
          <p className="mt-3 text-sm leading-7 text-white/78">
            An agency running this motion: <span className="text-white">$3,000–5,000/mo</span>,
            usually on a 6-month contract.
          </p>
          <p className="mt-2 text-sm leading-7 text-white/78">
            DIY: <span className="text-white">~$999/mo</span> across a rank tracker, content tools,
            and plugins — plus your hours every week.
          </p>
        </div>
        <div className="border border-white/10 bg-[#0A0A0A]/60 p-5 md:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
            <p className="font-[var(--font-bebas)] text-4xl leading-none text-white md:text-5xl">
              Autopilot · $498/mo
            </p>
          </div>
          <p className="mt-3 font-mono text-xs leading-6 text-white/65">
            No demo call. No 6-month contract. The price is the price.
          </p>
          <p className="mt-2 font-mono text-xs leading-6 text-white/65">
            14-day trial · cancel anytime · you keep every page it publishes.
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 text-center">
        <a
          href={CTA_HREF}
          className="inline-flex min-h-12 items-center justify-center bg-[#FF6B35] px-8 font-mono text-xs uppercase tracking-widest text-[#0A0A0A] transition-opacity duration-200 hover:opacity-90"
        >
          {CTA_LABEL} →
        </a>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/50">
          Signup takes 30 seconds. No call with anyone.
        </p>
      </div>
    </section>
  )
}

// Sticky close bar — appears only AFTER the reader has scrolled past the
// offer once (never spoils the price before the anchor comparison lands),
// hides while the offer itself is on screen, and stays dismissed for the tab
// session (sessionStorage, deliberately not localStorage). No countdowns, no
// fake scarcity — just the measured number and the price.
function StickyOfferBar({ gapVolumeMonthly }: { gapVolumeMonthly: number }) {
  const [seenOffer, setSeenOffer] = useState(false)
  const [offerInView, setOfferInView] = useState(false)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    setDismissed(window.sessionStorage.getItem("hubbly-offer-bar-dismissed") === "1")
    const offer = document.getElementById("offer")
    if (!offer) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setOfferInView(entry.isIntersecting)
          if (entry.isIntersecting) setSeenOffer(true)
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(offer)
    return () => observer.disconnect()
  }, [])

  if (dismissed || !seenOffer || offerInView) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#FF6B35]/50 bg-[#0A0A0A]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-5 py-3 md:flex-row md:justify-between md:px-10">
        <p className="font-mono text-xs text-white/80">
          {gapVolumeMonthly > 0
            ? `~${gapVolumeMonthly.toLocaleString()}/mo searches are going to competitors · Autopilot $498/mo`
            : "Autopilot · $498/mo · 14-day trial · cancel anytime"}
        </p>
        <div className="flex items-center gap-4">
          <a
            href={CTA_HREF}
            className="inline-flex min-h-10 items-center justify-center bg-[#FF6B35] px-5 font-mono text-[11px] uppercase tracking-widest text-[#0A0A0A] transition-opacity duration-200 hover:opacity-90"
          >
            {CTA_LABEL} →
          </a>
          <button
            type="button"
            onClick={() => {
              window.sessionStorage.setItem("hubbly-offer-bar-dismissed", "1")
              setDismissed(true)
            }}
            className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45 transition-colors hover:text-white/70"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
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

function CompleteReport({ audit }: { audit: Audit }) {
  const analysis = audit.analysis ?? {}
  const domain = useMemo(() => getDomain(audit.url), [audit.url])
  const companyName = analysis.company_name || domain
  const competitors = audit.competitors?.length ? audit.competitors : analysis.competitors ?? []
  const intent = audit.intent_data ?? {}
  const monthly = intent.monthly ?? 0
  const weekly = intent.weekly ?? 0
  const highIntent = intent.highIntent ?? intent.high_intent ?? 0
  const generatedDate = formatDate(audit.completed_at || audit.created_at)

  const seo = analysis.seo_report
  const gapVolumeMonthly = seo?.gapVolumeTotal ?? 0
  const topGapCompetitor =
    seo?.competitorGap?.[0]?.domain ?? seo?.gapKeywords?.[0]?.competitorDomain ?? ""
  const gapKeywordList = (seo?.gapKeywords ?? []).map((g) => g.keyword).filter(Boolean)
  const measuredIntentTerms = buildMeasuredIntentTerms(seo)
  // Feature-detect on fields that ship in a later payload change; render slot
  // stays in place today with an honest fallback so the hero shape is stable.
  const revenueAtRisk = (seo as unknown as { revenueAtRiskMonthly?: number } | undefined)
    ?.revenueAtRiskMonthly
  const aiCitations = (seo as unknown as { aiCitationCount?: number } | undefined)?.aiCitationCount
  const observed = analysis.observed_evidence ?? {}
  const detectedTechStack = observed.detected_tech_stack?.length
    ? observed.detected_tech_stack.join(", ")
    : undefined

  // Sales-letter section order: pain (SEO gaps) → agitate (live demand,
  // competitors) → diagnosis depth (what the engine read, who buys) →
  // pipeline math → value bridge → offer. Numbering is computed so it stays
  // monotonic even when the SEO section is absent for older audits.
  let sectionNumber = 0
  const nextEyebrow = () => {
    sectionNumber += 1
    return `Section ${sectionNumber}`
  }

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

        <VerdictHero
          companyName={companyName}
          monthly={monthly}
          gapVolumeMonthly={gapVolumeMonthly}
          revenueAtRisk={revenueAtRisk}
          aiCitations={aiCitations}
          industry={analysis.industry}
        />

        <div id="diagnosis" className="mt-14 scroll-mt-8 space-y-14 md:mt-20 md:space-y-20">
          {seo ? (
            <SeoSection seo={seo} companyName={companyName} eyebrow={nextEyebrow()} />
          ) : null}

          <ReportSection eyebrow={nextEyebrow()} title="People searching for you right now">
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
              {measuredIntentTerms.length > 0 && (
                <div>
                  <h3 className="font-mono text-xs uppercase tracking-[0.22em] text-[#FF6B35]">
                    Commercial terms {companyName} is measured against
                  </h3>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {measuredIntentTerms.map((term) => (
                      <span
                        key={term}
                        className="border border-[#FF6B35]/50 px-3 py-2 font-mono text-xs text-white/80"
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3">
                    <ProvenanceChip kind="measured" />
                  </div>
                </div>
              )}

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
                <div className="mt-3">
                  <ProvenanceChip kind="estimated" />
                </div>
              </div>
            </div>

            <p className="mt-8 font-[var(--font-bebas)] text-4xl leading-none text-[#FF6B35] md:text-6xl">
              These people are searching right now. Your competitors are already capturing some of them.
            </p>
          </ReportSection>

          <ReportSection eyebrow={nextEyebrow()} title="Who you're up against">
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
                      <td className="p-4 text-sm text-white/70">{fieldOrDash(competitor.their_angle)}</td>
                      <td className="p-4 text-sm text-white/70">{fieldOrDash(competitor.their_weakness)}</td>
                      <td className="p-4 text-sm text-white/70">{fieldOrDash(competitor.your_opening)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-5 font-mono text-xs text-white/55">
              {gapKeywordList.length > 0
                ? "Every gap keyword above is a page one of these competitors owns today."
                : "These are the names competing for the same buyers in the same searches."}
            </p>
          </ReportSection>

          <ReportSection eyebrow={nextEyebrow()} title="What Hubbly found">
            <div className="grid gap-4 md:grid-cols-2">
              <SnapshotRow label="Product/service" value={analysis.product} />
              <SnapshotRow label="Industry" value={analysis.industry} />
              <SnapshotRow label="Target market" value={analysis.icp?.primary?.title} />
              <SnapshotRow label="Current positioning" value={analysis.outreach_angle} />
              <SnapshotRow label="Primary CTA" value={fieldOrDash(observed.primary_cta_text)} />
              <SnapshotRow label="Tech stack" value={fieldOrDash(detectedTechStack)} />
            </div>
          </ReportSection>

          <ReportSection eyebrow={nextEyebrow()} title="Who actually buys this">
            <div className="grid gap-5 lg:grid-cols-3">
              <PersonaCard label="Primary" persona={analysis.icp?.primary} />
              <PersonaCard label="Secondary" persona={analysis.icp?.secondary} />
              <PersonaCard label="Emerging" persona={analysis.icp?.emerging} />
            </div>
            <p className="mt-6 border-l border-[#FF6B35] pl-4 font-mono text-sm text-white/70">
              These are the buyers every measured page Autopilot publishes is written for.
            </p>
          </ReportSection>

          <ReportSection eyebrow={nextEyebrow()} title="Your invisible pipeline">
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
                <div className="mt-3">
                  <ProvenanceChip kind="estimated" />
                </div>
                <p className="mt-6 border-t border-white/10 pt-4 font-mono text-xs leading-6 text-white/70">
                  The pixel is included with Autopilot — it installs during onboarding, after you start.
                </p>
              </div>
            </div>
          </ReportSection>

          <ValueBridge
            eyebrow={nextEyebrow()}
            companyName={companyName}
            gapKeywords={gapKeywordList}
            topGapCompetitor={topGapCompetitor}
            industry={analysis.industry}
          />

          <OfferClose companyName={companyName} />
        </div>
      </div>

      <StickyOfferBar gapVolumeMonthly={gapVolumeMonthly} />
    </main>
  )
}
