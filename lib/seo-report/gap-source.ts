import type { GapKeyword } from "./datasource";
import type { KeywordRow } from "./datasource";
import { isAddressKeyword, isBrandedKeyword } from "./keyword-filter";
import { normalizeSignalKeyword } from "./keyword-normalizer";

// §1 competitor-led commercial gap source.
//
// competitors_domain surfaces category competitors by keyword overlap; for a gold
// IRA company that means bullion dealers (apmex, jmbullion, ...) whose ranked sets
// are dominated by coin/bar catalog terms. The money product is the IRA, so the
// gap SCORER — not just the junk filter — weights IRA-intent commercial terms
// (rollover, custodian, fees, 401k, "best gold ira") above bullion-catalog terms,
// or the gap list skews to apmex's coin pages instead of the revenue keywords.

// IRA / retirement money intent — the terms the customer actually sells against.
const IRA_INTENT =
  /\b(ira|rollover|roll over|custodian|401\s?k|403\s?b|self[-\s]?directed|precious metals? ira|gold ira|silver ira|retirement|roth|sep ira|convert|transfer|nest egg|tax[-\s]?free)\b/i;
// Generic commercial intent — comparison / purchase modifiers. (No bare "price":
// a "gold price" lookup is commodity noise, not an IRA opportunity — see below.)
const COMMERCIAL_INTENT =
  /\b(best|top|companies|company|fees?|cost|costs|pricing|review|reviews|vs|versus|compare|comparison|near me|buy|legit|scam|complaints?|reputable|trusted)\b/i;
// Commodity / spot-price / unit-conversion / collector-trivia noise. Real search
// volume, but never the IRA money keyword for a gold-IRA company — a "1 oz gold
// price" or "1 pound gold to grams" lookup is a commodity query, not a content
// opportunity. Hard-excluded (unless the term also carries IRA intent). NB: "0z"
// is DataForSEO's zero-typo variant of "oz" and was evading the "oz" match.
const COMMODITY_NOISE =
  /\b(0z|oz|ounces?|coins?|bars?|bullion|rounds?|grams?|gm|gms|kilo|kg|pounds?|lbs?|spot|prices?|rates?|value|worth|size|weight|chart|today|live|biscuit|numismatic|proof|penny|pennies|nickels?|dimes?|quarters?|eagle|buffalo|krugerrand|maple leaf|philharmonic|britannia|morgan|peace dollar|libertad|jefferson|wheat|mintage|uncirculated|graded|pcgs|ngc|most valuable|rarest?)\b|\b\d{4}\b/i;
// Bare metal/product terms. A "1 10th gold" / "1 20 gold" query names a metal with
// no genuine commercial modifier — a product/price lookup, not a gap.
const METAL = /\b(gold|silver|platinum|palladium|coins?|bullion)\b/i;

// Live AHG audit (post Stage 2) surfaced fragments like "1 2 dollars",
// "1 2 goldback florida", "1 florida goldback", "1 2 ok" in the gaps list.
// These are DataForSEO query-log fragments (autocomplete prefix corruption),
// not real commercial searches — but they evaded every existing filter:
// not address/brand, "dollars"/"florida"/"goldback" are not commodity tokens,
// "goldback" carries no \bgold\b word boundary so METAL didn't match.
//
// Codex S1 review flagged the original rules ("length ≥ 7" + "needs ≥4 char
// token") as over-aggressive: they incorrectly rejected short legit
// multi-token money terms like "crm ai", "ai seo", "tax pro". The PRIME
// directive is "drop fragments, keep real money keywords" — so the relaxed
// rules below target the actual fragment patterns observed in production
// and accept short legit terms by design.
//
// Rules (any one triggers rejection):
// - Empty / whitespace.
// - Fewer than 2 whitespace-separated tokens. A single token is a topic,
//   not a search; either way it isn't a gap target.
// - Begins with a bare single-digit token ("1 X", "2 X Y"). These are
//   query-log prefix fragments; a real query keeps the digit inside a
//   multi-char token ("401k", "10 best ...") so multi-digit leading tokens
//   are NOT flagged.
// - Two or more tiny tokens (length ≤ 2). "1 2 ok" has three; "ai seo" has
//   one ("ai") and survives. "ok go" has two and is dropped.
// - No alphabetic token — drops pure-numeric fragments like "123 456".
//
// What survives by design: "gold ira", "crm ai", "ai seo", "tax pro",
// "401k rollover", "10 best gold ira companies", "vs alternatives".
//
// Defense in depth — does not replace isCommodityNoise / isAddressKeyword /
// isBrandedKeyword, runs alongside them.
export function isFragmentLikeKeyword(keyword: string): boolean {
  const value = keyword.trim().toLowerCase();
  if (!value) return true;
  const tokens = value.split(/\s+/).filter(Boolean);
  if (tokens.length < 2) return true;
  if (/^\d\b/.test(value)) return true;
  const tinyCount = tokens.filter((token) => token.length <= 2).length;
  if (tinyCount >= 2) return true;
  if (!tokens.some((token) => /[a-z]/.test(token))) return true;
  return false;
}

const IRA_WEIGHT = 3;
const COMMERCIAL_WEIGHT = 1.5;
const NEUTRAL_WEIGHT = 1;
const DEFAULT_VOLUME = 40; // small floor so a measured-but-zero-volume term still ranks by intent

// Commodity / spot-price / catalog / unit-conversion / trivia terms are junk for a
// gold-IRA company and are hard-excluded from the gap pool — unless the term also
// carries IRA intent (a "gold bullion ira" term is a money keyword, not catalog).
// The catch-all: a bare metal query with no genuine commercial modifier
// (best/companies/fees/review/vs/...) is a price/product lookup, never a gap.
export function isCommodityNoise(keyword: string): boolean {
  if (IRA_INTENT.test(keyword)) return false;
  if (COMMODITY_NOISE.test(keyword)) return true;
  if (METAL.test(keyword) && !COMMERCIAL_INTENT.test(keyword)) return true;
  return false;
}

// Intent multiplier among the survivors: IRA money intent outranks generic
// commercial. (Commodity noise is filtered before scoring, not down-weighted.)
export function gapIntentWeight(keyword: string): number {
  if (IRA_INTENT.test(keyword)) return IRA_WEIGHT;
  if (COMMERCIAL_INTENT.test(keyword)) return COMMERCIAL_WEIGHT;
  return NEUTRAL_WEIGHT;
}

export function scoreGapKeyword(keyword: string, volume?: number): number {
  const base = typeof volume === "number" && volume > 0 ? volume : DEFAULT_VOLUME;
  return Math.round(base * gapIntentWeight(keyword));
}

export function gapPageType(keyword: string): GapKeyword["pageType"] {
  const value = keyword.toLowerCase();
  if (/\b(best|top|vs|versus|compare|comparison|companies|company|review|reviews|alternative)\b/.test(value)) return "comparison";
  if (/\b(rollover|roll over|convert|transfer|how|guide|process|steps?|401\s?k)\b/.test(value)) return "guide";
  return "definition";
}

function normalize(keyword: string): string {
  return normalizeSignalKeyword(keyword);
}

export type CompetitorKeywordSet = { domain: string; rows: KeywordRow[] };

// Build the ranked gap list: commercial terms a competitor ranks top-10 for that
// the target does not rank for, junk-filtered, IRA-intent-scored, top N.
export function selectGapKeywords(
  competitorSets: CompetitorKeywordSet[],
  targetKeywords: KeywordRow[],
  brandLabel: string,
  limit = 10
): GapKeyword[] {
  const targetOwned = new Set(targetKeywords.map((row) => normalize(row.keyword)));
  const best = new Map<string, GapKeyword>();

  for (const set of competitorSets) {
    for (const row of set.rows) {
      const keyword = row.keyword?.trim();
      if (!keyword) continue;
      const key = normalize(keyword);
      if (targetOwned.has(key)) continue; // the target already ranks for it — not a gap
      if (typeof row.currentRank !== "number" || row.currentRank > 10) continue; // competitor must actually own it
      if (isAddressKeyword(keyword) || isBrandedKeyword(keyword, brandLabel)) continue; // junk / target brand
      if (isFragmentLikeKeyword(keyword)) continue; // query-log fragments — "1 2 ok", "1 florida goldback"
      if (isCommodityNoise(keyword)) continue; // spot-price / bullion-catalog — not an IRA opportunity

      const candidate: GapKeyword = {
        keyword,
        volume: row.volume,
        difficulty: row.difficulty,
        competitorDomain: set.domain,
        competitorRank: row.currentRank,
        pageType: gapPageType(keyword),
        score: scoreGapKeyword(keyword, row.volume)
      };
      const existing = best.get(key);
      // Keep the highest-scoring instance; tie-break to the better competitor rank.
      if (!existing || candidate.score > existing.score || (candidate.score === existing.score && candidate.competitorRank < existing.competitorRank)) {
        best.set(key, candidate);
      }
    }
  }

  return [...best.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}
