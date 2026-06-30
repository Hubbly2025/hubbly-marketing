import type { Classification } from "./classifier";
import type { BacklinkSummary, CompetitorRow, GapKeyword, KeywordRow } from "./datasource";
import { brandLabelFromDomain, cleanDisplayKeywords, isRankableGapKeyword, normalizeDisplayKeyword } from "./keyword-filter";
import { buildBusinessContext, filterEvidenceRelevantKeywords, filterRelevantGaps, filterRelevantKeywords, isCategoryCompetitor, type BusinessContext } from "./relevance";
import type {
  ExternalApiStatus,
  KeywordCluster,
  PlanMonth,
  ReportBacklinks,
  ReportCompetitors,
  ReportKeyword,
  ReportMetric,
  ReportPoint,
  SeoReport
} from "./types";
import { stripNavFromText } from "./nav-scrubber";

// Builds the Hubbly Signal "Full SEO Audit + 90-Day Domination Plan" report.
//
// Provenance discipline (golden rule):
// - Measured fields come only from DataForSEO ranked keywords / domain overview
//   or text literally detected on the scraped page.
// - Forward projections (expected results) and multi-engine AEO/GEO claims are
//   always labeled "recommended" — never measured.
// - When measured data is absent, the field fails loud with a labeled
//   recommendation, never an invented number.

const MEASURED = { provenance: "measured" as const, source: "DataForSEO", label: "Measured · Hubbly" };
const RECOMMENDED = { provenance: "recommended" as const, source: "Hubbly recommendation", label: "Recommendation" };
const AUTHORITY_KEYWORD_FLOOR = 2000;
const AUTHORITY_TRAFFIC_FLOOR = 5000;
const DISPLAY_KEYWORD_FLOOR = 3;

function measured(value: string, note?: string): ReportMetric {
  return { value, ...MEASURED, note };
}

function recommendation(value: string, note?: string): ReportMetric {
  return { value, ...RECOMMENDED, note };
}

type SynthesisInput = {
  domain: string;
  classification: Classification;
  keywords: KeywordRow[];
  domainRankOverview?: unknown;
  competitors?: CompetitorRow[] | null;
  backlinks?: BacklinkSummary | null;
  gapKeywords?: GapKeyword[] | null;
  pageText: string;
  generatedAt?: string;
  // Source-of-truth status for the DataForSEO leg of the audit. Defaults to
  // "measured" if dataforseoReturned, otherwise "unavailable" — explicit
  // "auth_failed" lets the report page render the service-unavailable
  // banner instead of an empty section.
  externalApiStatus?: ExternalApiStatus;
};

export function buildSeoReport(input: SynthesisInput): SeoReport {
  const generatedAt = input.generatedAt || new Date().toISOString();
  const date = generatedAt.slice(0, 10);
  // Strip nav fragments from pageText before any on-page extractor or business
  // context builder runs. The relevance gate below consumes this cleaned text.
  const cleanedPageText = stripNavFromText(input.pageText || "");
  const businessContext = buildBusinessContext(input.domain, input.classification, cleanedPageText);
  const keywords = input.keywords.filter((row) => Boolean(row.keyword));
  // Display set: dedupe + drop the office address / location noise everywhere.
  const displayKeywords = cleanDisplayKeywords(keywords);
  // Gaps, clusters, and the expansion seed additionally drop branded terms — a
  // branded #1 ranking is a strength to show, not a gap to build a page for.
  const brandLabel = brandLabelFromDomain(input.domain);
  const rankableKeywords = filterRelevantKeywords(
    displayKeywords.filter((row) => isRankableGapKeyword(row, brandLabel)),
    businessContext
  );
  const overview = parseDomainRankOverview(input.domainRankOverview);
  const competitors = buildCompetitors(input.competitors, businessContext);
  const backlinks = buildBacklinks(input.backlinks);
  const rawGaps = filterRelevantGaps(
    (input.gapKeywords || []).filter((gap) => Boolean(gap.keyword)),
    businessContext
  ).map((gap) => ({ ...gap, keyword: normalizeDisplayKeyword(gap.keyword) }));
  const dataforseoReturned =
    keywords.length > 0 || overview.organicCount !== null || overview.etv !== null || competitors !== null || backlinks !== null;
  const externalApiStatus: ExternalApiStatus = input.externalApiStatus ?? (dataforseoReturned ? "measured" : "unavailable");
  const hasMeasuredStatus = externalApiStatus === "measured";
  const gaps = hasMeasuredStatus ? rawGaps : [];
  const authorityGuardrailTriggered = hasMeasuredStatus && hasMacroAuthority(overview);
  const reportKeywords = hasMeasuredStatus
    ? authorityGuardrailTriggered && rankableKeywords.length < DISPLAY_KEYWORD_FLOOR
      ? fillAuthorityDisplayKeywords(rankableKeywords, displayKeywords, businessContext)
      : rankableKeywords
    : [];
  const reportCompetitors = hasMeasuredStatus ? competitors : null;
  const reportBacklinks = hasMeasuredStatus ? backlinks : null;
  const reportOverview = hasMeasuredStatus ? overview : { organicCount: null, etv: null };
  const gapVolumeTotal = gaps.reduce((sum, gap) => sum + (typeof gap.volume === "number" ? gap.volume : 0), 0);
  const competitorGap = buildCompetitorGap(gaps);
  const gapState: SeoReport["gapState"] =
    externalApiStatus === "empty"
      ? "greenfield"
      : gaps.length > 0
        ? "gaps"
        : reportKeywords.length > 0 || authorityGuardrailTriggered
          ? "defend"
          : "greenfield";

  return {
    title: "Hubbly Signal Full SEO Audit + 90-Day Domination Plan",
    domain: input.domain,
    generatedAt,
    scanDate: date,
    dataforseoReturned: hasMeasuredStatus && dataforseoReturned,
    externalApiStatus,
    measuredVia: `Measured by Hubbly · live search + on-page analysis ${date}`,
    scorecard: buildScorecard(reportKeywords, reportOverview, gaps, gapVolumeTotal, gapState, externalApiStatus, authorityGuardrailTriggered),
    strengths: buildStrengths(displayKeywords, cleanedPageText),
    weaknesses: buildWeaknesses(reportKeywords, gaps, gapState, externalApiStatus, authorityGuardrailTriggered),
    keywordAnalysis: {
      clusters: buildClusters(reportKeywords),
      semanticNote: keywordAnalysisNote(externalApiStatus)
    },
    competitors: reportCompetitors,
    backlinks: reportBacklinks,
    gapKeywords: gaps.map((gap) => ({
      keyword: gap.keyword,
      volume: gap.volume,
      competitorDomain: gap.competitorDomain,
      competitorRank: gap.competitorRank,
      pageType: gap.pageType
    })),
    gapVolumeTotal,
    competitorGap,
    gapState,
    plan: buildPlan(),
    closer: buildCloser()
  };
}

// Per-competitor count of owned gap terms, highest first — "who the demand flows to".
function buildCompetitorGap(gaps: GapKeyword[]): Array<{ domain: string; gapCount: number }> {
  const counts = new Map<string, number>();
  for (const gap of gaps) counts.set(gap.competitorDomain, (counts.get(gap.competitorDomain) || 0) + 1);
  return [...counts.entries()].map(([domain, gapCount]) => ({ domain, gapCount })).sort((a, b) => b.gapCount - a.gapCount);
}

function hasMacroAuthority(overview: DomainOverview): boolean {
  return (overview.organicCount ?? 0) > AUTHORITY_KEYWORD_FLOOR || (overview.etv ?? 0) > AUTHORITY_TRAFFIC_FLOOR;
}

function fillAuthorityDisplayKeywords<T extends KeywordRow>(current: T[], displayKeywords: T[], businessContext: BusinessContext): T[] {
  if (current.length >= DISPLAY_KEYWORD_FLOOR) return current;
  const existing = new Set(current.map((row) => normalizeDisplayKeyword(row.keyword).toLowerCase()));
  const evidenceBackfill = filterEvidenceRelevantKeywords(
    displayKeywords
      .filter((row) => !existing.has(normalizeDisplayKeyword(row.keyword).toLowerCase()))
      .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0)),
    businessContext
  );

  return [...current, ...evidenceBackfill].slice(0, Math.max(DISPLAY_KEYWORD_FLOOR, current.length));
}

function buildCompetitors(competitors: CompetitorRow[] | null | undefined, businessContext: BusinessContext): ReportCompetitors | null {
  // Honest-degrade rule: the upstream filter already dropped the target itself and
  // mega-platform noise. If fewer than two real category competitors survive, show
  // the execution-tier fallback rather than padding the section with a lonely or
  // noisy row. One competitor is not a credible "gap analysis".
  const categoryCompetitors = (competitors || []).filter((row) => isCategoryCompetitor(row, businessContext));
  if (categoryCompetitors.length < 2) return null;
  return {
    provenance: "measured",
    label: "Measured · Hubbly",
    items: categoryCompetitors.map((row) => ({
      domain: row.domain,
      basis:
        [
          typeof row.commonKeywords === "number" ? `${row.commonKeywords.toLocaleString()} shared keywords` : null,
          typeof row.organicKeywords === "number" ? `${row.organicKeywords.toLocaleString()} organic keywords` : null,
          typeof row.organicEtv === "number" ? `~${Math.round(row.organicEtv).toLocaleString()} ETV/mo` : null
        ]
          .filter(Boolean)
          .join(" · ") || "Competing organic domain"
    }))
  };
}

function buildBacklinks(backlinks: BacklinkSummary | null | undefined): ReportBacklinks | null {
  if (!backlinks) return null;
  const metrics: ReportMetric[] = [];
  if (typeof backlinks.referringDomains === "number") metrics.push(measured(`${backlinks.referringDomains.toLocaleString()} referring domains`));
  if (typeof backlinks.referringMainDomains === "number") metrics.push(measured(`${backlinks.referringMainDomains.toLocaleString()} referring main domains`));
  if (typeof backlinks.backlinks === "number") metrics.push(measured(`${backlinks.backlinks.toLocaleString()} total backlinks`));
  if (typeof backlinks.rank === "number") metrics.push(measured(`Authority rank ${backlinks.rank}/1000`));
  if (typeof backlinks.brokenBacklinks === "number") metrics.push(measured(`${backlinks.brokenBacklinks.toLocaleString()} broken backlinks`));
  if (metrics.length === 0) return null;
  return {
    provenance: "measured",
    label: "Measured · Hubbly",
    summary: "Hubbly backlink summary (health overview). Granular link lists are gated in-product.",
    metrics
  };
}

// --- Scorecard --------------------------------------------------------------

function buildScorecard(
  keywords: KeywordRow[],
  overview: DomainOverview,
  gaps: GapKeyword[] = [],
  gapVolumeTotal = 0,
  gapState: SeoReport["gapState"] = "defend",
  externalApiStatus: ExternalApiStatus = "measured",
  authorityGuardrailTriggered = false
): SeoReport["scorecard"] {
  if (externalApiStatus === "empty") {
    return {
      organicKeywords: recommendation(
        "No meaningful organic presence yet",
        "The measurement keys worked, but Hubbly did not find enough ranking data to assert a competitive gap analysis."
      ),
      monthlyTraffic: recommendation(
        "No measured traffic baseline yet",
        "Expected for a new or recently launched site. Hubbly establishes the baseline after the first build cycle."
      ),
      referringDomains: recommendation(
        "Full backlink summary pulled at execution",
        "Hubbly pulls the full backlink summary (health score) at execution; granular link lists are gated in-product."
      ),
      aiVisibility: recommendation(
        "Recommended multi-engine build (Google, Bing, Grok, Perplexity, ChatGPT)",
        "AI-engine visibility is not measured here. Hubbly recommends a GEO/AEO build; measured AI visibility ships once a source is wired."
      ),
      verdict: buildVerdict(keywords, gaps, gapVolumeTotal, gapState, externalApiStatus, authorityGuardrailTriggered)
    };
  }

  if (externalApiStatus === "auth_failed" || externalApiStatus === "unavailable") {
    return {
      organicKeywords: recommendation(
        "Measurement couldn't complete",
        "Retry the audit so Hubbly can fetch measured rankings before asserting organic presence."
      ),
      monthlyTraffic: recommendation(
        "Measurement couldn't complete",
        "Traffic estimates are withheld until the measurement service completes successfully."
      ),
      referringDomains: recommendation(
        "Measurement couldn't complete",
        "Backlink and competitor sections are withheld until the measurement service completes successfully."
      ),
      aiVisibility: recommendation(
        "Recommended multi-engine build (Google, Bing, Grok, Perplexity, ChatGPT)",
        "AI-engine visibility is not measured here. Hubbly recommends a GEO/AEO build; measured AI visibility ships once a source is wired."
      ),
      verdict: buildVerdict(keywords, gaps, gapVolumeTotal, gapState, externalApiStatus, authorityGuardrailTriggered)
    };
  }

  const organicKeywords =
    overview.organicCount !== null
      ? measured(`~${overview.organicCount.toLocaleString()}+`)
      : keywords.length > 0
        ? measured(
            `${keywords.length} ranked keywords analyzed`,
            "Sample of top measured ranked keywords. Hubbly measures the full keyword count at execution."
          )
        : recommendation(
            "Not measured in this run",
            "Hubbly measures total ranked keywords once the measured overview is connected."
          );

  const monthlyTraffic =
    overview.etv !== null
      ? measured(`~${Math.round(overview.etv).toLocaleString()} ETV/mo`)
      : recommendation(
          "Not measured in this run",
          "Hubbly measures estimated traffic value (ETV) at execution."
        );

  return {
    organicKeywords,
    monthlyTraffic,
    // Backlinks are not pulled in this run; the free audit shows a summary only.
    referringDomains: recommendation(
      "Full backlink summary pulled at execution",
      "Hubbly pulls the full backlink summary (health score) at execution; granular link lists are gated in-product."
    ),
    // No AEO/GEO data source is wired — never present a measured AI-visibility number.
    aiVisibility: recommendation(
      "Recommended multi-engine build (Google, Bing, Grok, Perplexity, ChatGPT)",
      "AI-engine visibility is not measured here. Hubbly recommends a GEO/AEO build; measured AI visibility ships once a source is wired."
    ),
    verdict: buildVerdict(keywords, gaps, gapVolumeTotal, gapState, externalApiStatus, authorityGuardrailTriggered)
  };
}

function buildVerdict(
  keywords: KeywordRow[],
  gaps: GapKeyword[] = [],
  gapVolumeTotal = 0,
  gapState: SeoReport["gapState"] = "defend",
  externalApiStatus: ExternalApiStatus = "measured",
  authorityGuardrailTriggered = false
): string {
  if (externalApiStatus === "empty") {
    return "No meaningful organic presence yet — expected for a new or recently launched site. There isn't enough ranking data to build a competitive gap analysis. Here's how Hubbly would establish one.";
  }
  if (externalApiStatus === "auth_failed" || externalApiStatus === "unavailable") {
    return "Measurement couldn't complete for this audit. Retry the audit so Hubbly can fetch measured rankings before asserting organic presence, competitor gaps, or demand.";
  }
  if (gapState === "greenfield") {
    return "No meaningful organic presence yet after relevance filtering — this is a greenfield build. Signal will not manufacture competitor demand; start with the core category pages, proof, and measured tracking.";
  }
  if (authorityGuardrailTriggered && gaps.length === 0) {
    return "Established organic presence detected from raw measured authority totals. The opportunity is defending the existing footprint, expanding mid-funnel demand, and tightening AI-engine visibility rather than treating the site as greenfield.";
  }
  const strong = keywords.filter((row) => (row.currentRank ?? 99) <= 3);
  const parts: string[] = [];
  if (strong.length > 0) {
    parts.push(`Strong rankings already on ${strong.length} measured term${strong.length === 1 ? "" : "s"}.`);
  }
  if (gaps.length > 0) {
    const volumeText = gapVolumeTotal > 0 ? ` — ~${gapVolumeTotal.toLocaleString()} searches/mo of demand flowing to them` : "";
    parts.push(
      `${gaps.length} high-intent commercial term${gaps.length === 1 ? "" : "s"} your competitors rank top-10 for and you're absent on${volumeText}.`
    );
  } else {
    // Defend branch: no padded loss number. For an incumbent that already ranks
    // for its core terms, the honest pitch is strength + the open mid-funnel / AI
    // surface — not a manufactured gap. This is a legitimate product answer.
    parts.push("You already rank for your core commercial terms — no open competitor gaps in this sample. The opportunity is the mid-funnel demand and AI-engine visibility you don't yet own, and defending the position you hold.");
  }
  return parts.join(" ");
}

// --- Strengths & weaknesses -------------------------------------------------

const TRUST_PATTERNS: Array<{ re: RegExp; claim: string }> = [
  { re: /buyback/i, claim: "Buyback commitment communicated on-page" },
  { re: /reviews?|testimonial|rated|stars?/i, claim: "Customer reviews / social proof present" },
  { re: /better business bureau|\bbbb\b/i, claim: "BBB trust signal present" },
  { re: /inc\.?\s?5000/i, claim: "Inc. 5000 recognition cited" },
  { re: /transparen\w+/i, claim: "Transparency emphasized" },
  { re: /education|educational|learn\b/i, claim: "Educational content for high-consideration buyers" },
  { re: /physical delivery|delivery/i, claim: "Physical delivery / fulfillment stated" },
  { re: /account (?:executive|specialist|executives|specialists)/i, claim: "Dedicated account specialists" },
  { re: /family[- ]owned/i, claim: "Family-owned positioning" }
];

function buildStrengths(keywords: KeywordRow[], pageText: string): ReportPoint[] {
  const strengths: ReportPoint[] = [];

  for (const keyword of keywords.filter((row) => (row.currentRank ?? 99) <= 3)) {
    strengths.push({
      claim: `Ranking in the top 3 for "${keyword.keyword}"`,
      provenance: "measured",
      label: "Measured · Hubbly",
      basis: `Current rank #${keyword.currentRank}${typeof keyword.volume === "number" ? `, ~${keyword.volume.toLocaleString()} monthly searches.` : "."}`
    });
  }

  for (const pattern of TRUST_PATTERNS) {
    const match = pattern.re.exec(pageText);
    if (match) {
      strengths.push({
        claim: pattern.claim,
        provenance: "measured",
        label: "Detected on-page",
        basis: snippetAround(pageText, match.index, match[0].length)
      });
    }
  }

  if (strengths.length === 0) {
    strengths.push({
      claim: "No measured on-page strengths detected in this run",
      provenance: "recommended",
      label: "Recommendation",
      basis: "Signal did not detect trust or ranking signals on the scraped pages. Hubbly will surface and strengthen them at execution."
    });
  }

  return strengths.slice(0, 8);
}

function buildWeaknesses(
  keywords: KeywordRow[],
  gaps: GapKeyword[] = [],
  gapState: SeoReport["gapState"] = "defend",
  externalApiStatus: ExternalApiStatus = "measured",
  authorityGuardrailTriggered = false
): ReportPoint[] {
  if (externalApiStatus === "empty") {
    return [
      {
        claim: "No meaningful relevant organic footprint detected yet",
        provenance: "recommended",
        label: "Recommendation",
        basis: "The measurement keys worked, but there is not enough ranking data to size a competitive gap analysis. Hubbly would start with the greenfield category build instead of a padded gap list."
      }
    ];
  }

  if (externalApiStatus === "auth_failed" || externalApiStatus === "unavailable") {
    return [
      {
        claim: "Measurement couldn't complete",
        provenance: "recommended",
        label: "Recommendation",
        basis: "Hubbly is withholding gap and competitor claims until the measurement service completes successfully. Retry the audit for measured rankings."
      }
    ];
  }

  // Lead with competitor gaps — the commercial terms a competitor owns and the
  // target is absent on — then the target's own weak rankings.
  const gapPoints: ReportPoint[] = gaps.map((gap) => {
    const volumeText = typeof gap.volume === "number" ? ` ~${gap.volume.toLocaleString()} monthly searches.` : "";
    return {
      claim: `Missing on commercial term "${gap.keyword}"`,
      provenance: "measured" as const,
      label: "Measured · Hubbly",
      basis: `${gap.competitorDomain} ranks #${gap.competitorRank}; you're absent.${volumeText}`.trim()
    };
  });

  if (gapState === "greenfield") {
    return [
      {
        claim: "No meaningful relevant organic footprint detected yet",
        provenance: "recommended",
        label: "Recommendation",
        basis: "After excluding off-domain terms, Signal found no relevant competitor-gap demand to size. Start with the greenfield category build instead of a padded gap list."
      }
    ];
  }

  if (authorityGuardrailTriggered && keywords.length === 0 && gaps.length === 0) {
    return [
      {
        claim: "Established organic footprint detected, but displayed keyword evidence is sparse",
        provenance: "recommended",
        label: "Recommendation",
        basis: "Raw measured authority totals crossed the guardrail, so Hubbly will not label the site greenfield. Displayed terms still require brand or on-page evidence."
      }
    ];
  }

  if (keywords.length === 0) {
    if (gapPoints.length > 0) return gapPoints;
    return [
      {
        claim: "Measured keyword visibility not available in this run",
        provenance: "recommended",
        label: "Recommendation",
        basis: "Hubbly measures commercial-intent gaps against competitors at execution."
      }
    ];
  }

  // Partial-defend lead: when no competitor gaps surfaced, an incumbent's gaps
  // section opens with the strength, not a manufactured loss.
  const defendLead: ReportPoint = {
    claim: "You own your core commercial terms",
    provenance: "measured",
    label: "Measured · Hubbly",
    basis: "No open competitor gaps surfaced in this measured sample — the opportunity is mid-funnel demand and AI-engine visibility, not head terms."
  };

  const weak = keywords.filter((row) => (row.currentRank ?? 99) > 3);
  if (weak.length === 0) {
    if (gapPoints.length > 0) return gapPoints;
    return [defendLead];
  }

  const ownWeak: ReportPoint[] = weak.map((row) => {
    const competitors = (row.competitorRanks || []).filter((rank) => rank <= 3).map((rank) => `#${rank}`);
    const rankText = row.currentRank ? `you rank #${row.currentRank}` : "you rank outside the top results";
    const competitorText = competitors.length > 0 ? `, competitors rank ${competitors.join(", ")}` : "";
    const volumeText = typeof row.volume === "number" ? ` ~${row.volume.toLocaleString()} monthly searches.` : "";
    return {
      claim: `Weak visibility on "${row.keyword}"`,
      provenance: "measured" as const,
      label: "Measured · Hubbly",
      basis: `${rankText}${competitorText}.${volumeText}`.trim()
    };
  });

  // Gaps lead when present; otherwise the defend lead opens, then the target's own
  // weak rankings demote to quick wins below.
  if (gapPoints.length > 0) return [...gapPoints, ...ownWeak];
  return [defendLead, ...ownWeak];
}

function keywordAnalysisNote(externalApiStatus: ExternalApiStatus): string {
  if (externalApiStatus === "empty") {
    return "No meaningful ranking footprint was detected yet, so Hubbly would begin with the core category pages and measured tracking before expanding clusters.";
  }
  if (externalApiStatus === "auth_failed" || externalApiStatus === "unavailable") {
    return "Keyword and competitor analysis are withheld until measurement completes. Retry the audit to generate a measured keyword map.";
  }
  return "Hubbly will draft full topic clusters with semantic depth, entity optimization, and schema markup.";
}

// --- Keyword clusters + semantic SEO ---------------------------------------

function buildClusters(keywords: KeywordRow[]): KeywordCluster[] {
  const clusters: KeywordCluster[] = [];

  const commercial = keywords.filter((row) => row.intent === "commercial");
  if (commercial.length > 0) {
    clusters.push({
      name: "Commercial / Transactional",
      intent: "commercial",
      provenance: "measured",
      label: "Measured · Hubbly",
      keywords: commercial.map(toReportKeyword)
    });
  }

  const informational = keywords.filter((row) => row.intent === "informational");
  if (informational.length > 0) {
    clusters.push({
      name: "Informational",
      intent: "informational",
      provenance: "measured",
      label: "Measured · Hubbly",
      keywords: informational.map(toReportKeyword)
    });
  }

  const expansions = buildSemanticExpansions(keywords);
  if (expansions.length > 0) {
    clusters.push({
      name: "Recommended semantic expansion",
      intent: "informational",
      provenance: "recommended",
      label: "Recommendation",
      keywords: expansions
    });
  }

  return clusters;
}

function toReportKeyword(row: KeywordRow): ReportKeyword {
  return {
    keyword: normalizeDisplayKeyword(row.keyword),
    volume: row.volume,
    currentRank: row.currentRank,
    competitorRanks: row.competitorRanks,
    provenance: "measured",
    label: "Measured · Hubbly"
  };
}

export type ExpansionIntent = "commercial" | "informational" | "navigational";

// Classify a seed keyword's intent. DataForSEO's intent label is a hint, but the
// decisive signal is the presence of commercial tokens — so curiosity terms like
// "1944 silver penny" never get commercial expansions.
export function classifyExpansionIntent(keyword: string, dataForSeoIntent?: KeywordRow["intent"]): ExpansionIntent {
  const value = keyword.toLowerCase();
  if (dataForSeoIntent === "branded") return "navigational";
  // Leading question words win first: "how does a gold ira work" is informational
  // even though it contains the commercial token "ira".
  if (/^(what|how|why|when|where|guide|is|are|does|do|can)\b/.test(value)) return "informational";
  const commercial =
    /\b(ira|rollover|company|companies|fees?|cost|costs|price|pricing|buy|best|service|services|software|tool|tools|platform|vs|versus|alternative|alternatives|review|reviews|provider|providers|account|invest|investment|insurance|loan|quote)\b|\bnear me\b/;
  if (commercial.test(value)) return "commercial";
  return "navigational";
}

// Intent-aware expansion (v2): commercial templates apply ONLY to commercial
// seeds; informational seeds get informational expansions; navigational/curiosity
// seeds get none. Only seeds with measured volume are expanded; capped at 4 per
// seed and 8 overall.
function buildSemanticExpansions(keywords: KeywordRow[]): ReportKeyword[] {
  const out: ReportKeyword[] = [];
  const seen = new Set<string>();

  for (const row of keywords) {
    if (typeof row.volume !== "number") continue; // head term must have measured volume
    const intent = classifyExpansionIntent(row.keyword, row.intent);
    if (intent === "navigational") continue;
    const base = stripTrailingQualifier(row.keyword);
    const topics =
      intent === "commercial"
        ? [`best ${base} companies 2026`, `${base} fees comparison`, `is a ${base} worth it`, `${base} cost`]
        : [`how does a ${base} work`, `${base} explained`, `${base} pros and cons`, `${base} vs alternatives`];

    for (const topic of topics.slice(0, 4)) {
      const key = topic.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ keyword: topic, provenance: "recommended", label: "Recommendation" });
      if (out.length >= 8) return out;
    }
  }
  return out;
}

function stripTrailingQualifier(keyword: string): string {
  return keyword.replace(/\s+(company|companies|services|reviews?|near me)$/i, "").trim() || keyword;
}

// --- 90-day plan ------------------------------------------------------------

function buildPlan(): SeoReport["plan"] {
  const months: PlanMonth[] = [
    {
      title: "Month 1 — Foundation & quick wins (Days 1-30)",
      actions: [
        "12-16 pages/month, drafted, optimized, schema'd, approval-gated",
        "Flagship semantic pillar + supporting cluster pages on the priority commercial gaps",
        "AI readiness: llms.txt, Organization + FAQ JSON-LD, AI-crawler robots policy",
        "On-page and technical fixes across priority templates"
      ],
      expectedResult: recommendation("Early lift of +20-40% organic traffic", "Projection, not a measured outcome.")
    },
    {
      title: "Month 2 — Velocity & authority (Days 31-60)",
      actions: [
        "12-16 more pages: comparison and definitional pages with semantic depth and schema",
        "Citable definitional pages targeted at AI-engine answers (Bing/IndexNow submission)",
        "Authority outreach (unlinked-mention drafts, approval-gated)"
      ],
      expectedResult: recommendation(
        "Top-of-page movement on core commercial terms",
        "Projection, not a measured outcome."
      )
    },
    {
      title: "Month 3 — Scale & compound (Days 61-90)",
      actions: [
        "12-16 more pages: supporting topical clusters that compound internal links",
        "Re-audit + iteration loop against the measured baseline",
        "Lost-traffic to search-intent optimization across the published set"
      ],
      expectedResult: recommendation(
        "Compounding organic + AI-engine visibility",
        "Projection, not a measured outcome."
      )
    }
  ];

  return {
    intro: "Hubbly drafts, optimizes, schemas, and prepares all content for publishing — approval-gated. You choose Semi or Full Autopilot.",
    months,
    totalOutput: "Hubbly will prepare 35-45+ pages across the 90-day plan (12-16/month)."
  };
}

function buildCloser(): SeoReport["closer"] {
  return {
    headline: "Activate Hubbly SEO Autopilot",
    body: "Hubbly will draft, optimize, schema, and prepare every page in the 90-day plan for publishing — including the AI-engine deliverables (llms.txt, FAQ/Organization JSON-LD, AI-crawler robots policy, IndexNow submission, citable definitional pages).",
    semiAutopilot: "Semi-Autopilot: you approve major deliverables before they ship.",
    fullAutopilot: "Full Autopilot: Hubbly runs it end-to-end with full transparency in your command center.",
    cta: "Approve & Begin Execution"
  };
}

// --- helpers ----------------------------------------------------------------

type DomainOverview = { organicCount: number | null; etv: number | null };

function parseDomainRankOverview(overview: unknown): DomainOverview {
  const tasks = asArray(asRecord(overview)?.tasks);
  for (const task of tasks) {
    for (const result of asArray(asRecord(task)?.result)) {
      for (const item of asArray(asRecord(result)?.items)) {
        const organic = asRecord(asRecord(item)?.metrics)?.organic;
        const record = asRecord(organic);
        if (record) {
          return {
            organicCount: numberOrNull(record.count),
            etv: numberOrNull(record.etv)
          };
        }
      }
    }
  }
  return { organicCount: null, etv: null };
}

function snippetAround(text: string, index: number, length: number, pad = 70): string {
  const start = Math.max(0, index - pad);
  const end = Math.min(text.length, index + length + pad);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
