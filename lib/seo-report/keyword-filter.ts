import type { KeywordRow } from "./datasource";

// Single source of truth for keyword junk-filtering, shared by the Rank emitter
// (pipeline.buildSeoGapsFromKeywords) and the displayed report (synthesis). Keeps
// the office address, brand-name navigational noise, and duplicates out of both.

export function brandLabelFromDomain(domain: string): string {
  return domain.replace(/^www\./, "").split(".")[0].replace(/[^a-z0-9]/gi, "").toLowerCase();
}

export function isAddressKeyword(keyword: string): boolean {
  const value = keyword.toLowerCase();
  if (/\b\d{5}\b/.test(value)) return true; // ZIP
  return /\d/.test(value) && /\b(blvd|boulevard|ave|avenue|street|st|road|rd|suite|ste|floor|fl|drive|dr|lane|ln)\b/.test(value);
}

export function isBrandedKeyword(keyword: string, brandLabel: string): boolean {
  return brandLabel.length >= 5 && keyword.toLowerCase().replace(/[^a-z0-9]/g, "").includes(brandLabel);
}

// Rank-emitter filter: real ranking opportunities only (no brand / address /
// navigational). Rank must never build a page for the brand name or an address.
export function isRankableGapKeyword(row: KeywordRow, brandLabel: string): boolean {
  const keyword = row.keyword.toLowerCase().trim();
  if (!keyword) return false;
  if (row.intent === "branded") return false;
  if (isAddressKeyword(keyword)) return false;
  if (isBrandedKeyword(keyword, brandLabel)) return false;
  return true;
}

export function normalizeDisplayKeyword(keyword: string): string {
  return keyword
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part)) return part;
      const lower = part.toLowerCase();
      if (lower === "0z") return preserveCase(part, "oz");
      return part.replace(/(?<=[a-z])[013578](?=[a-z])/gi, (digit) => digitLetterMap[digit] || digit);
    })
    .join("");
}

const digitLetterMap: Record<string, string> = {
  "0": "o",
  "1": "l",
  "3": "e",
  "5": "s",
  "7": "t",
  "8": "b"
};

function preserveCase(original: string, normalized: string): string {
  return original === original.toUpperCase() ? normalized.toUpperCase() : normalized;
}

// Display filter for the report: drop address noise and dedupe, but keep branded
// terms — a #1 branded ranking is a legitimate strength to show. Used for
// scorecard/strengths; gaps and clusters apply isRankableGapKeyword on top.
export function cleanDisplayKeywords(keywords: KeywordRow[]): KeywordRow[] {
  const seen = new Set<string>();
  const out: KeywordRow[] = [];
  for (const row of keywords) {
    const displayKeyword = normalizeDisplayKeyword(row.keyword || "");
    const key = displayKeyword.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    if (isAddressKeyword(key)) continue;
    seen.add(key);
    out.push({ ...row, keyword: displayKeyword });
  }
  return out;
}
