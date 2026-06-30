import type { Classification } from "./classifier";
import type { CompetitorRow, GapKeyword, KeywordRow } from "./datasource";
import { isCommodityNoise } from "./gap-source";
import { brandLabelFromDomain } from "./keyword-filter";
import { normalizeSignalKeyword } from "./keyword-normalizer";
import type { BusinessModel, BuyerType } from "./types";

export type RelevanceDecision = "on_domain" | "off_domain";

export type BusinessContext = {
  domain: string;
  business_model: BusinessModel;
  buyer_type: BuyerType;
  category_terms: string[];
  brand_terms: string[];
  brand_token_sequences: string[][];
  page_tokens: Set<string>;
};

export type RelevanceResult = {
  decision: RelevanceDecision;
  reason: string;
};

const CATEGORY_TERMS_BY_MODEL: Record<BusinessModel, string[]> = {
  b2b_saas: [
    "software",
    "platform",
    "automation",
    "workflow",
    "crm",
    "sales",
    "lead",
    "pipeline",
    "outbound",
    "appointment",
    "follow up"
  ],
  b2b_services: ["agency", "consulting", "managed service", "business", "enterprise"],
  b2c_ecommerce: ["shop", "buy", "shipping", "returns", "store"],
  b2c_financial_services: [
    "gold ira",
    "precious metals",
    "precious metals ira",
    "ira",
    "retirement",
    "rollover",
    "investment",
    "custodian",
    "401k",
    "wealth"
  ],
  b2c_high_consideration: ["service", "provider", "consultation", "quote", "reviews"],
  local_service: [
    "near me",
    "local",
    "licensed",
    "repair",
    "installation",
    "schedule",
    "plumber",
    "plumbing",
    "hvac",
    "electrician",
    "electrical",
    "drain",
    "leak",
    "water heater",
    "cleaning",
    "service",
    "contractor",
    "emergency"
  ],
  marketplace: ["marketplace", "providers", "vendors", "buyers", "sellers"],
  investor_vc: ["venture capital", "vc", "startup", "founders", "portfolio", "investment"],
  media_content: ["newsletter", "podcast", "publication", "articles", "subscribe"],
  other: []
};

const AGGREGATOR_OR_DIRECTORY_TERMS = /\b(capterra|g2|getapp|software advice|trustpilot|bbb|yelp|glassdoor|indeed)\b/i;
const DICTIONARY_OR_DEFINITION_TERMS = /\b(definition|meaning|dictionary|synonym|thesaurus|pronunciation|tolerance)\b/i;
const BUSINESS_MODIFIER_TERMS = /\b(best|top|companies|company|fees?|cost|costs|pricing|review|reviews|vs|versus|alternative|alternatives|guide|software|platform|services?)\b/i;
const COMPETITOR_SHARED_KEYWORD_FLOOR = 10;
const TOKEN_STOPWORDS = new Set([
  "about",
  "after",
  "also",
  "best",
  "call",
  "company",
  "contact",
  "cost",
  "from",
  "good",
  "home",
  "into",
  "local",
  "near",
  "number",
  "only",
  "page",
  "phone",
  "pricing",
  "review",
  "service",
  "services",
  "that",
  "their",
  "there",
  "this",
  "with",
  "your"
]);
const NON_COMPETITOR_DOMAINS = new Set([
  "merriam-webster.com",
  "dictionary.com",
  "thesaurus.com",
  "wikipedia.org",
  "capterra.com",
  "g2.com",
  "getapp.com",
  "softwareadvice.com",
  "trustpilot.com",
  "bbb.org"
]);

export function buildBusinessContext(domain: string, classification: Classification, pageText: string, companyName?: string | null): BusinessContext {
  const category = CATEGORY_TERMS_BY_MODEL[classification.business_model] || [];
  const source = `${classification.rationale || ""} ${pageText || ""}`;
  const sourceTerms = category.filter((term) => phraseMatches(source, term));
  const brand = brandLabelFromDomain(domain);
  const brandTerms = unique([brand, splitBrand(brand), companyName || ""].filter(Boolean));

  return {
    domain,
    business_model: classification.business_model,
    buyer_type: classification.buyer_type,
    category_terms: unique([...sourceTerms, ...category]),
    brand_terms: brandTerms,
    brand_token_sequences: brandTerms
      .map((term) => tokenizeAndClean(term).filter(isSignificantBrandToken))
      .filter((tokens) => tokens.length > 0),
    page_tokens: new Set(tokenizeAndClean(source).filter(isSignificantContentToken))
  };
}

export function classifyKeywordRelevance(keyword: string, context: BusinessContext): RelevanceResult {
  const value = normalize(keyword);
  if (!value) return { decision: "off_domain", reason: "empty_keyword" };
  const tokens = tokenizeAndClean(value);

  if (hasBrandTokenMatch(tokens, context)) {
    return { decision: "on_domain", reason: "brand_token_match" };
  }

  if (hasPageTextTokenMatch(tokens, context)) {
    return { decision: "on_domain", reason: "page_text_token_match" };
  }

  if (AGGREGATOR_OR_DIRECTORY_TERMS.test(value) && context.business_model !== "marketplace") {
    return { decision: "off_domain", reason: "aggregator_or_directory" };
  }

  if (context.business_model === "b2c_financial_services" && isCommodityNoise(value)) {
    return { decision: "off_domain", reason: "collector_or_commodity_noise" };
  }

  if (isDictionaryOrDefinitionIntent(value) && !hasCategoryMatch(value, context)) {
    return { decision: "off_domain", reason: "dictionary_or_definition_intent" };
  }

  if (hasCategoryMatch(value, context)) {
    return { decision: "on_domain", reason: "category_term_match" };
  }

  if (hasBrandCollision(value, context)) {
    return { decision: "off_domain", reason: "brand_collision_namesake" };
  }

  if (BUSINESS_MODIFIER_TERMS.test(value) && hasAnyCategoryToken(value, context)) {
    return { decision: "on_domain", reason: "category_modifier_match" };
  }

  return { decision: "off_domain", reason: "no_category_match" };
}

export function classifyKeywordEvidenceRelevance(keyword: string, context: BusinessContext): RelevanceResult {
  const value = normalize(keyword);
  if (!value) return { decision: "off_domain", reason: "empty_keyword" };
  const tokens = tokenizeAndClean(value);

  if (hasBrandTokenMatch(tokens, context)) {
    return { decision: "on_domain", reason: "brand_token_match" };
  }

  if (hasPageTextTokenMatch(tokens, context)) {
    return { decision: "on_domain", reason: "page_text_token_match" };
  }

  return { decision: "off_domain", reason: "no_evidence_match" };
}

export function filterRelevantKeywords<T extends KeywordRow>(keywords: T[], context: BusinessContext): T[] {
  const out: T[] = [];
  for (const row of keywords) {
    const result = classifyKeywordRelevance(row.keyword, context);
    if (result.decision === "on_domain") out.push(row);
    else logExclusion(context.domain, row.keyword, result.reason, "keyword");
  }
  return out;
}

export function filterEvidenceRelevantKeywords<T extends KeywordRow>(keywords: T[], context: BusinessContext): T[] {
  const out: T[] = [];
  for (const row of keywords) {
    const result = classifyKeywordEvidenceRelevance(row.keyword, context);
    if (result.decision === "on_domain") out.push(row);
    else logExclusion(context.domain, row.keyword, result.reason, "keyword");
  }
  return out;
}

export function filterRelevantGaps<T extends GapKeyword>(gaps: T[], context: BusinessContext): T[] {
  const out: T[] = [];
  for (const gap of gaps) {
    const result = classifyKeywordRelevance(gap.keyword, context);
    if (result.decision === "on_domain") out.push(gap);
    else logExclusion(context.domain, gap.keyword, result.reason, "gap");
  }
  return out;
}

export function isCategoryCompetitor(row: CompetitorRow, context: BusinessContext): boolean {
  const domain = rootDomain(row.domain);
  if (!domain || !domain.includes(".")) return false;
  if (domain === rootDomain(context.domain)) return false;
  if (NON_COMPETITOR_DOMAINS.has(domain)) return false;
  if (typeof row.commonKeywords !== "number" || row.commonKeywords < COMPETITOR_SHARED_KEYWORD_FLOOR) return false;
  if (hasBrandCollision(domainToPhrase(domain), context)) return false;
  return competitorDomainMatchesCategory(domain, context);
}

function logExclusion(domain: string, keyword: string, reason: string, source: "keyword" | "gap"): void {
  console.info("signal.relevance.excluded", { domain, keyword, reason, source });
}

function isDictionaryOrDefinitionIntent(value: string): boolean {
  if (DICTIONARY_OR_DEFINITION_TERMS.test(value)) return true;
  if (/^\d+(?:\s+\w+){0,2}$/.test(value)) return true;
  return false;
}

function hasCategoryMatch(value: string, context: BusinessContext): boolean {
  return context.category_terms.some((term) => phraseMatches(value, term));
}

function hasBrandTokenMatch(tokens: string[], context: BusinessContext): boolean {
  if (!tokens.length) return false;
  const tokenSet = new Set(tokens);
  return context.brand_token_sequences.some((sequence) => {
    if (sequence.length === 1) return sequence[0].length >= 4 && tokenSet.has(sequence[0]);
    return sequence.every((token) => tokenSet.has(token));
  });
}

function hasPageTextTokenMatch(tokens: string[], context: BusinessContext): boolean {
  return tokens.some((token) => isSignificantContentToken(token) && context.page_tokens.has(token));
}

function hasAnyCategoryToken(value: string, context: BusinessContext): boolean {
  const tokens = new Set(value.split(/\s+/).filter((token) => token.length >= 3));
  return context.category_terms.some((term) => term.split(/\s+/).some((token) => token.length >= 3 && tokens.has(token)));
}

function hasBrandCollision(value: string, context: BusinessContext): boolean {
  const collapsedValue = collapseRepeatedLetters(value.replace(/[^a-z0-9]/g, ""));
  return context.brand_terms.some((brand) => {
    const collapsedBrand = collapseRepeatedLetters(brand.replace(/[^a-z0-9]/g, ""));
    if (collapsedBrand.length < 4) return false;
    return collapsedValue.includes(collapsedBrand) || collapsedBrand.includes(collapsedValue);
  });
}

function competitorDomainMatchesCategory(domain: string, context: BusinessContext): boolean {
  const phrase = domainToPhrase(domain);
  if (context.business_model === "b2b_saas") {
    return /\b(crm|lead|pipeline|outreach|apollo|hubspot|pipedrive|close)\b/.test(phrase) || /sales|loft|spot|force/.test(phrase);
  }
  if (context.business_model === "b2c_financial_services") {
    return /\b(gold|silver|bullion|ira|metal|wealth|capital|investment|hartford|apmex|jm|bureau)\b/.test(phrase) || /goldco|bullion/.test(phrase);
  }
  return hasAnyCategoryToken(phrase, context);
}

function splitBrand(brand: string): string {
  return brand.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
}

function phraseMatches(value: string, phrase: string): boolean {
  const normalizedValue = normalize(value);
  const normalizedPhrase = normalize(phrase);
  if (!normalizedPhrase) return false;
  const pattern = new RegExp(`\\b${escapeRegExp(normalizedPhrase).replace(/\s+/g, "\\s+")}\\b`, "i");
  return pattern.test(normalizedValue);
}

function domainToPhrase(domain: string): string {
  return rootDomain(domain).split(".")[0].replace(/[-_]/g, " ");
}

function rootDomain(value: string): string {
  return value
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .trim();
}

function normalize(value: string): string {
  return normalizeSignalKeyword(value);
}

export function tokenizeAndClean(value: string): string[] {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 3);
}

function unique(values: string[]): string[] {
  return [...new Set(values.map(normalize).filter(Boolean))];
}

function isSignificantBrandToken(token: string): boolean {
  return token.length > 3 && !TOKEN_STOPWORDS.has(token);
}

function isSignificantContentToken(token: string): boolean {
  return token.length > 3 && !TOKEN_STOPWORDS.has(token);
}

function collapseRepeatedLetters(value: string): string {
  return value.replace(/([a-z])\1+/g, "$1");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
