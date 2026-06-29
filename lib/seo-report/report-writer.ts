import Anthropic from "@anthropic-ai/sdk";
import { generationModel } from "./models";
import type { SeoReport } from "./types";

// Turns the gated SeoReport data block into the final report text.
//
// Two layers of anti-fabrication safety:
// 1. renderReportMarkdown() is fully deterministic and gated — it is the
//    guaranteed floor and the fallback. The model is never the source of data.
// 2. writeSeoReportMarkdown() lets Claude write the prose from the data block,
//    but the output is validated against hard gates (no measured line without
//    measured data, no "Hubbly will publish", null sections must echo their
//    fallback string). Any violation falls back to the deterministic render.

export type ReportMeta = {
  status: string;
  buyerType: string;
  businessModel: string;
  confidence: string;
};

const reportWriterModel = generationModel;

const COMPETITORS_FALLBACK = "Competitor analysis available at execution tier.";
const BACKLINKS_FALLBACK = "Backlink profile available at execution tier.";
const KEYWORDS_FALLBACK = "Keyword data not assessed in this scan. Full keyword + intent mapping available at execution tier.";
const EMPTY_KEYWORDS_FALLBACK =
  "No meaningful organic presence yet. Hubbly would establish the first keyword map with core category pages, proof pages, and measured tracking.";
const EMPTY_COMPETITORS_FALLBACK =
  "There isn't enough ranking data to build a competitive gap analysis. Hubbly would establish one after the greenfield category build has a measured footprint.";
const EMPTY_BACKLINKS_FALLBACK =
  "No measured authority baseline yet. Hubbly pulls backlink health at execution after the first measurable footprint is established.";
const RETRY_KEYWORDS_FALLBACK =
  "Keyword measurement couldn't complete. Retry the audit to generate a measured keyword map.";
const RETRY_COMPETITORS_FALLBACK =
  "Competitor measurement couldn't complete. Retry the audit before asserting competitor gaps.";
const RETRY_BACKLINKS_FALLBACK =
  "Backlink measurement couldn't complete. Retry the audit before asserting authority gaps.";

const SYSTEM_PROMPT = `You are a Senior SEO Consultant and Hubbly Swarm Strategist writing one artifact: an honest, high-value Full SEO Audit + 90-Day Domination Plan for Hubbly Signal.

Write the report ONLY from the INPUT DATA block in the user message. You have no other knowledge of this domain. If a value is not in the block, it does not exist — never supply it from your own knowledge.

STRICT RULES (never break):
1. Use ONLY data present in INPUT DATA. Never fabricate competitors, backlinks, rankings, keywords, traffic, or any number.
2. Label every fact: SEO/keyword/competitor/backlink data from the block as "Measured · Hubbly", on-page findings as "Measured (on-page)", anything you reason or project as "Recommendation". Never name the underlying data vendor anywhere in the output — the customer-facing source is always "Hubbly".
3. Print "Measured by Hubbly · live search + on-page analysis {scan_date}" ONLY if measured_data_returned is true. If false, omit it entirely.
4. For any section whose data is null/empty, do not write analysis — output the exact fallback string provided for that section.
5. Never promise autonomous publishing. Say "Hubbly will draft, optimize, and prepare all content for publishing." Never "Hubbly will publish."
6. All forward projections are ranges tagged "Recommendation". No guarantees, especially on traffic or revenue.
7. Tie SEO recommendations to lost traffic / search-intent signals where the data supports it.
8. Never echo nav, menus, product lists, cookie banners, or raw scrape fragments.
9. Do not compute or alter scan_date or confidence — print the provided values.

OUTPUT STRUCTURE (exact, markdown):
**Hubbly Signal Full SEO Audit + 90-Day Domination Plan**
**{domain}**
{status} | {buyer_type} | {business_model} | Confidence: {confidence}

(If measured_data_returned is true, print the Measured-via line here. Else omit.)

#### 1. SEO Scorecard
#### 2. Strengths & Weaknesses
#### 3. Semantic SEO + Keyword Analysis
#### 4. Competitor Gap Analysis
#### 5. Backlink Profile
#### 6. 90-Day SEO Domination Plan
#### 7. Activate Hubbly SEO Autopilot

VOICE: Direct, confident, no-BS. Compelling, never overpromising. No banned words (delve, crucial, pivotal, vibrant, groundbreaking). Sentence-case headings. No emojis.`;

export async function writeSeoReportMarkdown(report: SeoReport, meta: ReportMeta): Promise<string> {
  const deterministic = renderReportMarkdown(report, meta);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return deterministic;

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: reportWriterModel,
      max_tokens: 2600,
      temperature: 0.4,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `INPUT DATA (use verbatim, never compute or invent):\n${JSON.stringify(buildInputDataBlock(report, meta), null, 2)}` }]
    });
    const text = message.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("\n")
      .trim();

    if (isAcceptable(text, report)) return text;
    console.warn("signal.report_writer.rejected", { domain: report.domain });
    return deterministic;
  } catch (error) {
    console.warn("signal.report_writer.failed", { domain: report.domain, error: error instanceof Error ? error.message : String(error) });
    return deterministic;
  }
}

// Hard anti-fabrication gates. A model that violates any of these is discarded
// in favor of the deterministic render.
export function isAcceptable(text: string, report: SeoReport): boolean {
  if (text.length < 400) return false;
  if (!text.includes(report.domain)) return false;
  if (/hubbly\s+will\s+publish/i.test(text)) return false;
  if (!report.dataforseoReturned && /measured by hubbly/i.test(text)) return false;
  // White-label invariant: the underlying data vendor name never reaches the
  // customer. Any leak (e.g. the LLM echoing a source field) is rejected to the
  // deterministic render, which carries only "Measured · Hubbly".
  if (/dataforseo/i.test(text)) return false;
  if (!report.competitors && !text.includes(competitorsFallback(report))) return false;
  if (!report.backlinks && !text.includes(backlinksFallback(report))) return false;
  if (report.keywordAnalysis.clusters.length === 0 && !text.includes(keywordsFallback(report))) return false;
  return true;
}

export function buildInputDataBlock(report: SeoReport, meta: ReportMeta) {
  return {
    domain: report.domain,
    scan_date: report.scanDate,
    status: cap(meta.status),
    buyer_type: cap(meta.buyerType),
    business_model: humanModel(meta.businessModel),
    confidence: cap(meta.confidence),
    measured_data_returned: report.dataforseoReturned,
    scorecard: {
      organicKeywords: report.scorecard.organicKeywords,
      monthlyTraffic: report.scorecard.monthlyTraffic,
      referringDomains: report.scorecard.referringDomains,
      aiVisibility: report.scorecard.aiVisibility,
      verdict: report.scorecard.verdict
    },
    keywords: report.keywordAnalysis.clusters.length > 0 ? report.keywordAnalysis.clusters : null,
    onpage: { strengths: report.strengths, weaknesses: report.weaknesses },
    competitors: report.competitors,
    backlinks: report.backlinks,
    gap: {
      state: report.gapState,
      volume_total: report.gapVolumeTotal,
      keywords: report.gapKeywords.length > 0 ? report.gapKeywords : null,
      by_competitor: report.competitorGap.length > 0 ? report.competitorGap : null
    },
    plan: report.plan,
    cta: report.closer,
    fallbacks: { competitors: competitorsFallback(report), backlinks: backlinksFallback(report), keywords: keywordsFallback(report) }
  };
}

// --- deterministic, fully gated render --------------------------------------

export function renderReportMarkdown(report: SeoReport, meta: ReportMeta): string {
  const lines: string[] = [];
  lines.push(`**${report.title}**`);
  lines.push(`**${report.domain}**`);
  lines.push(`${cap(meta.status)} | ${cap(meta.buyerType)} | ${humanModel(meta.businessModel)} | Confidence: ${cap(meta.confidence)}`);
  lines.push("");
  if (report.dataforseoReturned) {
    lines.push(`**${report.measuredVia}**`);
    lines.push("");
  }

  lines.push("#### 1. SEO Scorecard");
  lines.push(`- Organic keywords: ${report.scorecard.organicKeywords.value} (${report.scorecard.organicKeywords.label})`);
  lines.push(`- Est. monthly traffic: ${report.scorecard.monthlyTraffic.value} (${report.scorecard.monthlyTraffic.label})`);
  lines.push(`- Referring domains: ${report.scorecard.referringDomains.value} (${report.scorecard.referringDomains.label})`);
  lines.push(`- AI visibility: ${report.scorecard.aiVisibility.value} (${report.scorecard.aiVisibility.label})`);
  lines.push(`- Verdict: ${report.scorecard.verdict}`);
  lines.push("");

  lines.push("#### 2. Strengths & Weaknesses");
  lines.push("Strengths:");
  for (const point of report.strengths) lines.push(`- ${point.claim} (${point.label})`);
  lines.push("Critical gaps:");
  for (const point of report.weaknesses) lines.push(`- ${point.claim} (${point.label}) — ${point.basis}`);
  lines.push("");

  lines.push("#### 3. Semantic SEO + Keyword Analysis");
  if (report.keywordAnalysis.clusters.length > 0) {
    for (const cluster of report.keywordAnalysis.clusters) {
      lines.push(`**${cluster.name}** (${cluster.label})`);
      for (const keyword of cluster.keywords) lines.push(`- ${keyword.keyword}${keywordMeta(keyword)}`);
    }
    lines.push(`${report.keywordAnalysis.semanticNote} (Recommendation)`);
  } else {
    lines.push(keywordsFallback(report));
  }
  lines.push("");

  lines.push("#### 4. Competitor Gap Analysis");
  if (report.competitors) {
    for (const item of report.competitors.items) lines.push(`- ${item.domain} — ${item.basis} (${report.competitors.label})`);
    lines.push("Hubbly will close these gaps with targeted semantic content and on-page optimization. (Recommendation)");
  } else {
    lines.push(competitorsFallback(report));
  }
  lines.push("");

  lines.push("#### 5. Backlink Profile");
  if (report.backlinks) {
    for (const metric of report.backlinks.metrics) lines.push(`- ${metric.value} (${metric.label})`);
    lines.push(report.backlinks.summary);
    lines.push("Recommended: prioritize high-authority referring domains and reclaim broken links. (Recommendation)");
  } else {
    lines.push(backlinksFallback(report));
  }
  lines.push("");

  lines.push("#### 6. 90-Day SEO Domination Plan");
  lines.push(report.plan.intro);
  for (const month of report.plan.months) {
    lines.push(`**${month.title}**`);
    for (const action of month.actions) lines.push(`- ${action}`);
    lines.push(`- Expected (Recommendation): ${month.expectedResult.value}`);
  }
  lines.push(report.plan.totalOutput);
  lines.push("");

  lines.push("#### 7. Activate Hubbly SEO Autopilot");
  lines.push(`**${report.closer.headline}**`);
  lines.push(report.closer.body);
  lines.push(`- ${report.closer.semiAutopilot}`);
  lines.push(`- ${report.closer.fullAutopilot}`);
  lines.push(`**${report.closer.cta}**`);

  return lines.join("\n");
}

function keywordMeta(keyword: { currentRank?: number; volume?: number }): string {
  const parts: string[] = [];
  if (typeof keyword.currentRank === "number") parts.push(`rank #${keyword.currentRank}`);
  if (typeof keyword.volume === "number") parts.push(`${keyword.volume.toLocaleString()}/mo`);
  return parts.length > 0 ? ` (${parts.join(", ")})` : "";
}

function keywordsFallback(report: SeoReport): string {
  if (report.externalApiStatus === "empty") return EMPTY_KEYWORDS_FALLBACK;
  if (report.externalApiStatus === "auth_failed" || report.externalApiStatus === "unavailable") return RETRY_KEYWORDS_FALLBACK;
  return KEYWORDS_FALLBACK;
}

function competitorsFallback(report: SeoReport): string {
  if (report.externalApiStatus === "empty") return EMPTY_COMPETITORS_FALLBACK;
  if (report.externalApiStatus === "auth_failed" || report.externalApiStatus === "unavailable") return RETRY_COMPETITORS_FALLBACK;
  return COMPETITORS_FALLBACK;
}

function backlinksFallback(report: SeoReport): string {
  if (report.externalApiStatus === "empty") return EMPTY_BACKLINKS_FALLBACK;
  if (report.externalApiStatus === "auth_failed" || report.externalApiStatus === "unavailable") return RETRY_BACKLINKS_FALLBACK;
  return BACKLINKS_FALLBACK;
}

function cap(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function humanModel(model: string): string {
  return model
    .split("_")
    .map((segment) => (/^b2[bc]$/i.test(segment) ? segment.toUpperCase() : segment.charAt(0).toUpperCase() + segment.slice(1)))
    .join(" ");
}
