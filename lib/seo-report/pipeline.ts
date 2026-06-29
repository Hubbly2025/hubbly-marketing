import { getRedis } from "./redis";
import { normalizeDomain } from "./domain";
import { minRealContentChars, scrapeSite, type ScrapedPage } from "./scrape";
import { classifyFromText } from "./classifier";
import { fallbackAuditFromScrape } from "./anthropic";
import { buildCategoryDemandEstimate } from "./estimates";
import { buildSeoReport } from "./synthesis";
import { renderReportMarkdown, writeSeoReportMarkdown } from "./report-writer";
import { getServiceSupabase } from "./supabase";
import { withTimeout } from "./timeout";
import { DataForSeoSource } from "./sources/dataforseo";
import { isUuid } from "./uuid";
import type { KeywordRow, NormalizedPull, SignalDataSource } from "./datasource";
import type { SeoGap, SeoGapPageType } from "./jobs";
import { brandLabelFromDomain, isRankableGapKeyword } from "./keyword-filter";
import type { CategoryDemandIntelligence, IntelligenceMetric, Provenance, SignalAudit, SignalIntelligence } from "./types";

const cacheTtlSeconds = 60 * 60 * 24 * 30;
// Bump when the audit shape changes so a deploy invalidates stale cached audits
// instead of serving a pre-change report. v2 = Full SEO Audit + 90-Day plan.
// v14 = Stage 2.1 hotfix: scopes digit-typo display normalization to keyword
// strings only and preserves numeric template copy.
// v13 = Stage 2.1 ship-ready audit: per-status report copy plus display
// normalization for digit-for-letter keyword variants.
// v12 = Stage 2 relevance cache bust: forces already-cached domains through
// the deployed relevance-gated audit path instead of serving pre-#23 payloads.
// v11 = Stage 2 relevance gate: cached audits now carry the post-filter
// greenfield/defend/gaps state and filtered demand totals.
// v10 = Stage 2 two-reviewer pass: adds seoReport.externalApiStatus (the
// auth_failed banner cannot render without it) and gap list has the fragment
// filter applied (live AHG re-audit pre-bump still served the pre-filter
// gaps "1 2 ok", "1 2 goldback florida", etc., with the OLD audit UUID).
const auditCacheVersion = "v14-scope-digit-normalization";
// Budget: scrape (28s, non-fatal) + enrichment (claude 18s, non-fatal) +
// persist (6s) must stay under the route's 55s cap / 60s maxDuration. DataForSEO
// runs in parallel with the scrape so it never adds to the critical path.
const scrapeStepTimeoutMs = 28000;
const claudeStepTimeoutMs = 18000;
const persistStepTimeoutMs = 6000;
export const signalDataSources: SignalDataSource[] = [new DataForSeoSource()];

type EngineContext = {
  id: string;
  domain: string;
  url: string;
  pulls: NormalizedPull[];
};

export function hasEnoughSignalForAudit(text: string): boolean {
  return text.trim().length >= minRealContentChars;
}

export async function ingest(domain: string, sources: SignalDataSource[] = signalDataSources): Promise<NormalizedPull[]> {
  const runId = crypto.randomUUID();
  const settled = await Promise.allSettled(
    sources.map((source) => withTimeout(source.fetch(domain, { runId }), `source:${source.name}`, source.timeoutMs))
  );

  return settled.map((result, index) => {
    const source = sources[index];
    if (result.status === "fulfilled") return result.value;
    return {
      source: source?.name || "unknown",
      domain,
      fetchedAt: new Date().toISOString(),
      status: "failed",
      provenance: "measured",
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
      data: {}
    };
  });
}

export function normalize(pulls: NormalizedPull[]): NormalizedPull[] {
  return pulls.map((pull) => ({
    ...pull,
    fetchedAt: pull.fetchedAt || new Date().toISOString(),
    data: pull.data || {}
  }));
}

export function classify(pulls: NormalizedPull[], domain: string) {
  return classifyFromText(domain, publicTextFromPulls(pulls));
}

export function analyze(pulls: NormalizedPull[], domain: string) {
  const classification = classify(pulls, domain);
  return {
    classification,
    categoryDemand: buildCategoryDemandForPulls(domain, classification.business_model, pulls)
  };
}

export function assembleSignalIntelligence(context: EngineContext): SignalIntelligence {
  const normalizedPulls = normalize(context.pulls);
  const publicText = publicTextFromPulls(normalizedPulls);
  const classification = classify(normalizedPulls, context.domain);
  const firstPage = normalizedPulls.flatMap((pull) => pull.data.scrapePages || [])[0];
  const keywordRows = normalizedPulls.flatMap((pull) => pull.data.keywords || []);
  const categoryDemand = buildCategoryDemandForPulls(context.domain, classification.business_model, normalizedPulls);

  const intelligence: SignalIntelligence = {
    id: context.id,
    domain: context.domain,
    url: context.url,
    generatedAt: new Date().toISOString(),
    status: hasEnoughSignalForAudit(publicText) ? "ready" : "not_enough_signal",
    classifier: classification,
    detected: {
      companyName: firstPage?.title || null,
      valueProps: [
        {
          claim: "Public-page category messaging was detected in the offline fixture.",
          source: "detected",
          basis: publicText.slice(0, 260) || "Not detected from public pages."
        }
      ],
      offers: [],
      proofPoints: [],
      callsToAction: [],
      techStack: normalizedPulls.flatMap((pull) => pull.data.techStack || []).map((tech) => ({
        claim: tech,
        source: "detected",
        basis: "Normalized source pull."
      }))
    },
    inferred: {
      positioning: [
        {
          claim: `The site appears to fit the ${classification.business_model} category.`,
          source: "inferred",
          provenance: "inferred",
          basis: classification.rationale
        }
      ],
      conversionFriction: [],
      audienceSignals: []
    },
    seo: {
      title: firstPage?.title || null,
      metaDescription: null,
      headings: [],
      issues: [],
      opportunities: keywordRows.slice(0, 3).map((row) => ({
        claim: `Investigate keyword gap: ${row.keyword}`,
        source: "inferred",
        basis: "Offline normalized keyword fixture."
      }))
    },
    personas: [
      {
        name: "Retirement diversification researcher",
        frame: classification.buyer_type === "consumer" ? "consumer" : "company",
        description: "A high-consideration buyer comparing precious metals retirement options.",
        provenance: "inferred",
        detectedSignals: [classification.rationale],
        inferredNeeds: ["Clear proof, transparent process, and risk framing."]
      }
    ],
    competitiveLandscape: {
      disclaimer: "Suggested angles only. Signal does not assert named competitor weaknesses from this scrape.",
      suggestedAngles: [
        {
          claim: "Differentiate around trust, education, and retirement-risk clarity.",
          source: "inferred",
          provenance: "recommended",
          basis: "Suggested from category and public-page language."
        }
      ]
    },
    categoryDemand,
    invisiblePipeline: {
      explanation: "A visitor-identification pixel can turn anonymous category demand into follow-up signals.",
      detectedReadinessSignals: [],
      recommendedPixelEvents: ["Page viewed", "CTA clicked", "Return visit"]
    },
    keywordThemes: keywordRows.slice(0, 4).map((row) => ({
      theme: row.keyword,
      intent: row.intent === "branded" ? "navigational" : row.intent || "commercial",
      phrases: [row.keyword],
      basis: "Offline normalized keyword fixture."
    })),
    close: {
      headline: "Signal feeds Hubbly OS.",
      body: "Signal intelligence keeps provenance attached before any downstream activation."
    },
    scrape: {
      pagesRead: normalizedPulls.flatMap((pull) =>
        (pull.data.scrapePages || []).map((page) => ({
          url: page.url,
          status: pull.status === "complete" ? 200 : 0,
          title: page.title,
          textSample: page.text.slice(0, 260)
        }))
      ),
      notDetected: []
    }
  };

  intelligence.seoReport = buildSeoReport({
    domain: context.domain,
    classification,
    keywords: keywordRows,
    domainRankOverview: normalizedPulls.find((pull) => pull.source === "DataForSEO")?.data.domainRankOverview,
    pageText: publicText,
    generatedAt: intelligence.generatedAt
  });

  return assertSignalIntelligenceProvenance(intelligence);
}

export function buildSeoGapsFromKeywords(domain: string, keywordRows: KeywordRow[]): SeoGap[] {
  const brandLabel = brandLabelFromDomain(domain);
  return keywordRows
    .filter((row) => typeof row.volume === "number" && typeof row.difficulty === "number")
    .filter((row) => isRankableGapKeyword(row, brandLabel))
    .map((row) => {
      const strikeZone = Boolean(
        row.competitorRanks?.some((rank) => rank >= 1 && rank <= 3) && row.currentRank && row.currentRank >= 11 && row.currentRank <= 20
      );
      return {
        topic: row.keyword,
        keyword: row.keyword,
        page_type: pageTypeForKeyword(row.keyword, row.intent),
        intent: row.intent || "commercial",
        priority: strikeZone ? "high" : "normal",
        volume: row.volume,
        difficulty: row.difficulty,
        current_rank: row.currentRank,
        strike_zone: strikeZone
      };
    });
}

function pageTypeForKeyword(keyword: string, intent?: KeywordRow["intent"]): SeoGapPageType {
  const value = keyword.toLowerCase();
  if (/\b(vs|versus|alternative|alternatives|compare|comparison|best)\b/.test(value)) return "comparison";
  if (/^(what is|what are|what's|define|definition of)\b/.test(value) || intent === "informational") return "definition";
  return "guide";
}

function buildCategoryDemandForPulls(domain: string, businessModel: SignalIntelligence["classifier"]["business_model"], pulls: NormalizedPull[]): CategoryDemandIntelligence {
  const estimate = buildCategoryDemandEstimate(domain, businessModel);
  const dataForSeoPull = pulls.find((pull) => pull.source === "DataForSEO");
  const measuredKeywords = dataForSeoPull?.status === "complete" ? dataForSeoPull.data.keywords || [] : [];

  if (measuredKeywords.length === 0) {
    if (dataForSeoPull && dataForSeoPull.status !== "complete") {
      console.warn("signal.dataforseo.estimated_fallback", {
        domain,
        status: dataForSeoPull.status,
        error: dataForSeoPull.error || "DataForSEO returned no measured keyword rows."
      });
    }
    return estimate;
  }

  const monthlySearches = measuredKeywords.reduce((sum, row) => sum + (row.volume || 0), 0);
  const highIntent = measuredKeywords.filter((row) => row.intent === "commercial").reduce((sum, row) => sum + (row.volume || 0), 0);

  return {
    ...estimate,
    intentVolume: measuredStringMetric(`${measuredKeywords.length} top ranked keywords`),
    highIntent: measuredStringMetric(formatNumber(highIntent)),
    monthlySearchDemand: measuredStringMetric(formatNumber(monthlySearches)),
    disclaimer: "Measured keyword fields use Hubbly's top-ranked Google keyword rows. Other demand fields remain labeled estimates where no measured source was supplied."
  };
}

function measuredStringMetric(value: string): IntelligenceMetric<string> {
  return {
    value,
    provenance: "measured",
    source: "DataForSEO",
    label: "Measured · Hubbly",
    confidence: 0.9
  };
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

export function assertSignalIntelligenceProvenance(intelligence: SignalIntelligence): SignalIntelligence {
  for (const [key, metric] of Object.entries(intelligence.categoryDemand)) {
    if (key === "disclaimer") continue;
    if (!isIntelligenceMetric(metric)) {
      return handleBadMetric(intelligence, `categoryDemand.${key}`);
    }
  }

  return intelligence;
}

function handleBadMetric(intelligence: SignalIntelligence, path: string): SignalIntelligence {
  const message = `Signal intelligence metric is missing label or provenance: ${path}`;
  if (process.env.NODE_ENV === "production") {
    console.error("signal.intelligence.provenance_error", { path });
    return coerceCategoryDemandMetrics(intelligence);
  }
  throw new Error(message);
}

function coerceCategoryDemandMetrics(intelligence: SignalIntelligence): SignalIntelligence {
  for (const key of Object.keys(intelligence.categoryDemand) as Array<keyof typeof intelligence.categoryDemand>) {
    if (key === "disclaimer") continue;
    const metric = intelligence.categoryDemand[key];
    if (!isIntelligenceMetric(metric)) {
      intelligence.categoryDemand[key] = {
        value: "unavailable",
        provenance: "estimated",
        source: "category-benchmark",
        label: "Estimate"
      } as never;
    }
  }
  return intelligence;
}

function isIntelligenceMetric(value: unknown): value is IntelligenceMetric<unknown> {
  if (!value || typeof value !== "object") return false;
  return "value" in value && hasNonEmptyString(value, "label") && hasNonEmptyString(value, "provenance");
}

function hasNonEmptyString(value: object, key: string): boolean {
  const candidate = (value as Record<string, unknown>)[key];
  return typeof candidate === "string" && candidate.length > 0;
}

// Resolves the DataForSEO pull's runtime state into a small, stable string so the
// summary log + the UI banner can agree on what "no measured data" means in any
// given audit.
export function dataForSeoSummaryStatus(
  pull: NormalizedPull | undefined
): "measured" | "empty" | "auth_failed" | "unavailable" {
  if (!pull) return "unavailable";
  if (pull.data.authFailed) return "auth_failed";
  if (pull.status === "complete") return "measured";
  if (pull.status === "empty") return "empty";
  return "unavailable";
}

function publicTextFromPulls(pulls: NormalizedPull[]): string {
  return pulls
    .flatMap((pull) => pull.data.scrapePages || [])
    .map((page) => page.text)
    .join("\n\n");
}

export async function runSignalAudit(input: string): Promise<{ id: string; audit: SignalAudit; cached: boolean }> {
  const { domain, url } = normalizeDomain(input);
  const cacheKey = `signal:audit:${auditCacheVersion}:${domain}`;
  const redis = getRedis();
  const cached = redis ? await redis.get<{ id: string; audit: SignalAudit }>(cacheKey) : null;
  if (cached) return { ...cached, cached: true };

  // Fetch DataForSEO in parallel with the scrape so the measured SEO report can
  // be produced even when the on-page scrape is thin or times out.
  const ingestPromise = ingest(domain).catch((error) => {
    console.warn("signal.audit.ingest_failed", { domain, error: error instanceof Error ? error.message : String(error) });
    return [] as NormalizedPull[];
  });

  // The scrape never fails the audit: a timeout or error degrades to empty pages
  // and the pipeline still proceeds to DataForSEO + synthesis.
  const scrapeStartedAt = Date.now();
  let pages: ScrapedPage[] = [];
  try {
    pages = await withTimeout(scrapeSite(url), "scrape", scrapeStepTimeoutMs);
  } catch (error) {
    console.warn("signal.scrape.degraded", {
      domain,
      reason: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - scrapeStartedAt
    });
    pages = [];
  }
  console.info("signal.audit.step", {
    domain,
    step: "scrape",
    durationMs: Date.now() - scrapeStartedAt,
    pages: pages.length,
    textLength: pages.reduce((total, page) => total + page.text.length, 0)
  });
  const joinedText = pages.map((page) => page.text).join("\n\n");
  const classification = classifyFromText(domain, joinedText);

  const pulls = await ingestPromise;
  const dataForSeoPull = pulls.find((pull) => pull.source === "DataForSEO");
  const keywords = pulls.flatMap((pull) => pull.data.keywords || []);
  const domainRankOverview = dataForSeoPull?.data.domainRankOverview;
  const competitors = dataForSeoPull?.data.competitors ?? null;
  const backlinks = dataForSeoPull?.data.backlinksSummary ?? null;
  const gapKeywords = dataForSeoPull?.data.gapKeywords ?? null;
  const hasOnPageSignal = hasEnoughSignalForAudit(joinedText);
  const hasMeasuredKeywords = keywords.length > 0;
  // One log line per audit summarizing whether DataForSEO returned measured
  // data. This is the observability hook: a missing line means ingest never
  // ran; a status of "auth_failed" means credentials were rejected; an "empty"
  // means the keys worked but no keywords ranked. The UI banner keys off the
  // same shape so logs and the rendered report agree.
  const summaryStatus = dataForSeoSummaryStatus(dataForSeoPull);
  console.info("signal.dataforseo.summary", {
    domain,
    status: summaryStatus,
    keywordCount: keywords.length,
    competitorCount: competitors?.length ?? 0,
    hasBacklinks: Boolean(backlinks),
    gapCount: gapKeywords?.length ?? 0,
    authFailed: Boolean(dataForSeoPull?.data.authFailed),
    error: dataForSeoPull?.error
  });

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Only the honest "not enough signal" outcome when there is neither readable
  // on-page content nor measured DataForSEO keywords to build a report from.
  if (!hasOnPageSignal && !hasMeasuredKeywords) {
    const notEnough: SignalAudit = {
      id,
      domain,
      url,
      generatedAt: now,
      status: "not_enough_signal",
      classifier: classification,
      detected: {
        companyName: null,
        valueProps: [],
        offers: [],
        proofPoints: [],
        callsToAction: [],
        techStack: []
      },
      inferred: {
        positioning: [],
        conversionFriction: [],
        audienceSignals: []
      },
      seo: {
        title: null,
        metaDescription: null,
        headings: [],
        issues: [{ claim: "Not enough public-page content was detected for an SEO audit.", source: "detected", basis: "Not detected from public pages." }],
        opportunities: []
      },
      personas: [],
      competitiveLandscape: {
        disclaimer: "Suggested angles only. Signal does not assert named competitor weaknesses from this scrape.",
        suggestedAngles: []
      },
      categoryDemand: buildCategoryDemandEstimate(domain, classification.business_model),
      seoReport: buildSeoReport({ domain, classification, keywords, domainRankOverview, competitors, backlinks, gapKeywords, pageText: joinedText, generatedAt: now, externalApiStatus: summaryStatus }),
      invisiblePipeline: {
        explanation: "Signal needs public-page content before recommending visitor-identification events.",
        detectedReadinessSignals: [],
        recommendedPixelEvents: []
      },
      keywordThemes: [],
      close: {
        headline: "Signal feeds Hubbly OS.",
        body: "Once your public demand signals are readable, Hubbly OS can turn them into routed GTM motion."
      },
      scrape: {
        pagesRead: pages.map((page) => ({
          url: page.url,
          status: page.status,
          title: page.title,
          textSample: page.text.slice(0, 260)
        })),
        notDetected: ["Not enough signal from home, pricing, or about pages."]
      }
    };
    await persistAuditBestEffort(notEnough, pages);
    if (redis) await redis.set(cacheKey, { id, audit: notEnough }, { ex: cacheTtlSeconds });
    return { id, audit: notEnough, cached: false };
  }

  // The gated data block (deterministic, fully provenance-labeled) is the source
  // of truth. The report-writer turns it into the report; on timeout/error it
  // degrades to the deterministic markdown render rather than failing the audit.
  const seoReport = buildSeoReport({ domain, classification, keywords, domainRankOverview, competitors, backlinks, gapKeywords, pageText: joinedText, generatedAt: now, externalApiStatus: summaryStatus });
  const reportMeta = {
    status: "ready",
    buyerType: classification.buyer_type,
    businessModel: classification.business_model,
    confidence: classification.confidence
  };

  const enrichmentStartedAt = Date.now();
  // The report-writer turns the gated data block into the report; on timeout/error
  // it degrades to the deterministic markdown render rather than failing the audit.
  const reportMarkdown = await withTimeout(writeSeoReportMarkdown(seoReport, reportMeta), "report_writer", claudeStepTimeoutMs).catch((error) => {
    console.warn("signal.audit.report_writer_degraded", { domain, reason: error instanceof Error ? error.message : String(error) });
    return renderReportMarkdown(seoReport, reportMeta);
  });
  seoReport.markdown = reportMarkdown;

  // Legacy audit sections are filled deterministically (hidden when seoReport is
  // present) purely to satisfy the SignalAudit shape. Tech-stack enrichment
  // (BuiltWith) was removed: it cost a paid call per audit and rendered nowhere.
  const parsed = fallbackAuditFromScrape(classification, pages);
  console.info("signal.audit.step", {
    domain,
    step: "enrichment",
    durationMs: Date.now() - enrichmentStartedAt,
    onPageSignal: hasOnPageSignal,
    measuredKeywords: keywords.length,
    competitors: competitors?.length ?? 0,
    hasBacklinks: Boolean(backlinks),
    pulls: pulls.map((pull) => ({ source: pull.source, status: pull.status, error: pull.error }))
  });
  const categoryDemand = buildCategoryDemandForPulls(domain, classification.business_model, pulls);

  const audit: SignalAudit = {
    id,
    domain,
    url,
    generatedAt: now,
    status: "ready",
    classifier: classification,
    ...parsed,
    categoryDemand,
    seoReport,
    close: {
      headline: "Signal feeds Hubbly OS.",
      body: "Signal turns public GTM, SEO, and visitor intent into the demand layer Hubbly OS can route, prioritize, and activate."
    },
    scrape: {
      pagesRead: pages.map((page) => ({
        url: page.url,
        status: page.status,
        title: page.title,
        textSample: page.text.slice(0, 260)
      })),
      notDetected: [
        "Private analytics",
        "CRM pipeline",
        "Paid media performance",
        "Named competitor weaknesses"
      ]
    }
  };

  await persistAuditBestEffort(audit, pages);
  if (redis) await redis.set(cacheKey, { id, audit }, { ex: cacheTtlSeconds });
  return { id, audit, cached: false };
}

// Marketing deployment wraps signal_audits insert as best-effort. The table is
// Signal-specific; in marketing the seo_report is stored on audit_leads.analysis
// and signal_audits doesn't exist. A missing-table error must NOT fail the audit.
async function persistAuditBestEffort(audit: SignalAudit, pages: unknown): Promise<void> {
  try {
    await withTimeout(persistAudit(audit, pages), "persist_audit", persistStepTimeoutMs);
  } catch (error) {
    console.warn("signal.persist.skipped", {
      domain: audit.domain,
      reason: error instanceof Error ? error.message : String(error)
    });
  }
}

async function persistAudit(audit: SignalAudit, pages: unknown): Promise<void> {
  const supabase = getServiceSupabase();
  const { error } = await supabase.from("signal_audits").insert({
    id: audit.id,
    domain: audit.domain,
    audit,
    scrape: pages
  });

  if (error) throw new Error(error.message);
}

export async function getAuditById(id: string): Promise<SignalAudit | null> {
  if (!isUuid(id)) return null;
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.from("signal_audits").select("audit").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.audit as SignalAudit | undefined) || null;
}
