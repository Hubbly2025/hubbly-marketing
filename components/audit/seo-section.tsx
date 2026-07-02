import type { SeoReport } from "@/lib/seo-report/types"
import { ReportSection } from "./report-parts"

type SeoSectionProps = {
  seo: SeoReport
  companyName: string
  // Sales-letter restructure moved this section to the top of the report, so
  // the parent owns the numbering; default preserves the legacy position.
  eyebrow?: string
}

export function SeoSection({ seo, companyName, eyebrow = "Section 4B" }: SeoSectionProps) {
  const scorecard = seo.scorecard
  const apiStatus = seo.externalApiStatus

  // Honest banner when DataForSEO didn't return measured data — never silently
  // empty. auth_failed is the loudest case (creds are bad), unavailable means
  // the run skipped the call entirely.
  if (apiStatus === "auth_failed" || apiStatus === "unavailable") {
    return (
      <ReportSection eyebrow={eyebrow} title="Your SEO opportunity">
        <div className="border border-white/10 bg-white/[0.03] p-6 md:p-10">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/65">
            Measured SEO data unavailable in this run
          </p>
          <p className="mt-4 max-w-2xl text-lg text-white/78">
            {apiStatus === "auth_failed"
              ? "Hubbly Intelligence credentials were rejected on this run. The SEO section will populate on the next successful audit."
              : "Hubbly Intelligence did not return measured data in time. The SEO section will populate on the next successful audit."}
          </p>
        </div>
      </ReportSection>
    )
  }

  return (
    <ReportSection eyebrow="Section 4B" title="Your SEO opportunity">
      {/* Verdict — the one-line headline of the SEO state. */}
      <div className="border border-[#FF6B35]/60 bg-[#FF6B35]/[0.04] p-6 md:p-10">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/65">
          Where {companyName} stands in organic search
        </p>
        <p className="mt-4 max-w-3xl text-xl text-white md:text-2xl">{scorecard.verdict}</p>
        <p className="mt-6 font-mono text-xs text-white/55">{seo.measuredVia}</p>
      </div>

      {/* Scorecard — four measured/recommended metrics. ReportMetric.value is a
          STRING, not a number — render .value directly. .label carries the
          provenance pill text (e.g. "Measured · Hubbly" vs "Recommendation"). */}
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SeoMetricTile label="Organic keywords" metric={scorecard.organicKeywords} />
        <SeoMetricTile label="Monthly traffic" metric={scorecard.monthlyTraffic} />
        <SeoMetricTile label="Referring domains" metric={scorecard.referringDomains} />
        <SeoMetricTile label="AI visibility" metric={scorecard.aiVisibility} />
      </div>

      {/* Gap state branches — honest copy per state, never a padded number. */}
      {seo.gapState === "greenfield" && (
        <div className="mt-8 border border-white/10 bg-white/[0.03] p-6 md:p-10">
          <h3 className="font-mono text-xs uppercase tracking-[0.22em] text-[#FF6B35]">
            Greenfield build
          </h3>
          <p className="mt-4 max-w-2xl text-lg text-white/78">
            No meaningful organic presence yet after relevance filtering. Hubbly will not
            manufacture competitor demand. Start with the core category pages, proof, and
            measured tracking.
          </p>
        </div>
      )}

      {seo.gapState === "defend" && (
        <div className="mt-8 border border-white/10 bg-white/[0.03] p-6 md:p-10">
          <h3 className="font-mono text-xs uppercase tracking-[0.22em] text-[#FF6B35]">
            Defend position
          </h3>
          <p className="mt-4 max-w-2xl text-lg text-white/78">
            {companyName} already ranks for its core commercial terms with no open competitor
            gaps in this sample. The opportunity is mid-funnel demand and AI-engine
            visibility — not a padded loss number.
          </p>
        </div>
      )}

      {seo.gapState === "gaps" && seo.gapKeywords.length > 0 && (
        <div className="mt-8">
          <h3 className="font-mono text-xs uppercase tracking-[0.22em] text-[#FF6B35]">
            Commercial keywords your competitors capture and you don&apos;t
          </h3>
          <p className="mt-2 font-mono text-xs text-white/55">
            {seo.gapKeywords.length} gap{seo.gapKeywords.length === 1 ? "" : "s"}
            {seo.gapVolumeTotal > 0
              ? ` · ~${seo.gapVolumeTotal.toLocaleString()} searches/mo flowing to competitors`
              : ""}
          </p>
          <div className="mt-4 divide-y divide-white/10 border border-white/10 bg-white/[0.02]">
            {seo.gapKeywords.slice(0, 10).map((gap) => (
              <div
                key={`${gap.keyword}-${gap.competitorDomain}`}
                className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 md:grid-cols-[1.5fr_1fr_auto]"
              >
                <span className="font-mono text-sm text-white">{gap.keyword}</span>
                <span className="hidden font-mono text-xs text-white/60 md:block">
                  {gap.competitorDomain} ranks #{gap.competitorRank}
                </span>
                <span className="font-mono text-xs text-white/80">
                  {typeof gap.volume === "number" ? `~${gap.volume.toLocaleString()}/mo` : "—"}
                </span>
              </div>
            ))}
            {seo.gapKeywords.length > 10 && (
              <div className="px-4 py-3 font-mono text-xs text-white/55">
                + {seo.gapKeywords.length - 10} more gap
                {seo.gapKeywords.length - 10 === 1 ? "" : "s"} measured in this audit
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compounding urgency — annualize the measured monthly gap and name the
          top competitor by domain, so the reader sees a real number tied to a
          real name, not a template. Only render when we have both. */}
      {seo.gapState === "gaps" && seo.gapVolumeTotal > 0 && (
        <div className="mt-8 border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <h3 className="font-mono text-xs uppercase tracking-[0.22em] text-[#FF6B35]">
            The compounding cost
          </h3>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-white/80">
            {`~${seo.gapVolumeTotal.toLocaleString()} commercial searches per month × 12 = `}
            <span className="text-white">
              ~{(seo.gapVolumeTotal * 12).toLocaleString()} searches
            </span>
            {` a year that `}
            {seo.competitorGap?.[0]?.domain ? (
              <span className="text-white">{seo.competitorGap[0].domain}</span>
            ) : (
              <span className="text-white">the current #1 competitor</span>
            )}
            {` and its peers capture instead of ${companyName}. Every month
            without a measured motion widens the gap — competitors compound
            authority, and clawing back a keyword after a rival owns it takes
            longer than not losing it in the first place.`}
          </p>
        </div>
      )}

      {/* A1 — measured competitors block. Rendered only when the payload names
          them. Never invent a competitor list; om-mit the block on null. */}
      {seo.competitors && seo.competitors.items.length > 0 && (
        <div className="mt-8">
          <h3 className="font-mono text-xs uppercase tracking-[0.22em] text-[#FF6B35]">
            Measured organic competitors
          </h3>
          <div className="mt-4 divide-y divide-white/10 border border-white/10 bg-white/[0.02]">
            {seo.competitors.items.slice(0, 8).map((c) => (
              <div
                key={c.domain}
                className="grid grid-cols-[1fr_1fr] items-baseline gap-4 px-4 py-3 md:grid-cols-[240px_1fr]"
              >
                <span className="font-mono text-sm text-white">{c.domain}</span>
                <span className="text-xs text-white/65">{c.basis}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
            {seo.competitors.label}
          </p>
        </div>
      )}

      {/* Strengths & weaknesses — ReportPoint.claim is the field, NOT .text. */}
      {(seo.strengths.length > 0 || seo.weaknesses.length > 0) && (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {seo.strengths.length > 0 && (
            <div>
              <h3 className="font-mono text-xs uppercase tracking-[0.22em] text-[#FF6B35]">
                Measured strengths
              </h3>
              <ul className="mt-4 space-y-3">
                {seo.strengths.slice(0, 5).map((point, i) => (
                  <li key={i} className="text-sm text-white/80">
                    <span className="text-white">{point.claim}</span>
                    {point.basis ? (
                      <span className="ml-2 font-mono text-xs text-white/55">— {point.basis}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {seo.weaknesses.length > 0 && (
            <div>
              <h3 className="font-mono text-xs uppercase tracking-[0.22em] text-[#FF6B35]">
                Measured weaknesses
              </h3>
              <ul className="mt-4 space-y-3">
                {seo.weaknesses.slice(0, 5).map((point, i) => (
                  <li key={i} className="text-sm text-white/80">
                    <span className="text-white">{point.claim}</span>
                    {point.basis ? (
                      <span className="ml-2 font-mono text-xs text-white/55">— {point.basis}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Closing pull-quote — mirrors Section 4's big-numeral closer. */}
      {seo.gapState === "gaps" && seo.gapVolumeTotal > 0 && (
        <p className="mt-8 font-[var(--font-bebas)] text-4xl leading-none text-[#FF6B35] md:text-6xl">
          ~{seo.gapVolumeTotal.toLocaleString()} searches/month flowing to competitors. Hubbly
          turns that flow back to you.
        </p>
      )}
    </ReportSection>
  )
}

// Single scorecard tile. metric.value is the printable string; metric.label is
// the provenance pill text. note (optional) is a clarifying line under it.
function SeoMetricTile({
  label,
  metric,
}: {
  label: string
  metric: SeoReport["scorecard"]["organicKeywords"]
}) {
  return (
    <div className="border border-white/10 bg-white/[0.03] p-4">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-white/55">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{metric.value}</p>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
        {metric.label}
      </p>
      {metric.note ? (
        <p className="mt-2 text-xs leading-snug text-white/55">{metric.note}</p>
      ) : null}
    </div>
  )
}
