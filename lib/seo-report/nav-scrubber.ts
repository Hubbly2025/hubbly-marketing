import type { SignalAudit } from "./types";

// Shared nav scrubber used by both the audit pipeline (before synthesis) and
// the report page (before render). The PRIME directive: raw nav, menu items,
// product-grid fragments, and verbatim page headings must never reach the
// customer. Defense in depth across three layers:
//
// 1. fallbackAuditFromScrape synthesizes its outputs from the classifier.
// 2. stripNavFromText cleans the joined pageText fed to buildSeoReport, so
//    snippetAround in synthesis.ts can never extract nav text around a
//    trust-pattern match.
// 3. The report page sanitizes any persisted heading / keyword theme /
//    persona / markdown line via the same predicate.

// True for a fragment that reads like a nav/menu item, button label, or
// product-grid echo. Conservative: avoids dropping real headings ("Retirement
// diversification narrative") while catching the patterns observed in live
// AHG runs ("Open PRODUCTS Close PRODUCTS Open PRODUCTS", "Skip to content",
// "Mythical Creatures Griffin 1").
export function isLikelyNav(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.length < 4) return true;
  if (/skip to (?:content|main)/i.test(trimmed)) return true;
  if (/toggle (?:navigation|menu)/i.test(trimmed)) return true;
  if (/(?:^|\s)(?:open|close)\s+(?:menu|navigation|search|cart|submenu)/i.test(trimmed)) return true;
  if (/^(?:menu|search|cart|home|about|contact|pricing|products?|services?|blog|careers?|subscribe|sign in|sign up|log in|log out|read more|learn more|view all|see all|back to top)$/i.test(trimmed)) return true;
  // ≥2 ALL-CAPS tokens (PRODUCTS, MENU, SEARCH) in one fragment — mega-menu
  // echo. Real prose rarely chains caps tokens; legitimate acronyms like
  // "IRA" appearing alone are fine.
  const tokens = trimmed.split(/\s+/);
  const allCaps = tokens.filter((token) => /^[A-Z]{2,}$/.test(token));
  if (allCaps.length >= 2) return true;
  // Title-case fragment ending in a bare integer (e.g. "Mythical Creatures Griffin 1").
  if (/^(?:[A-Z][a-z]+\s+){2,}\d+$/.test(trimmed)) return true;
  return false;
}

export function stripNavLikeStrings(values: string[]): string[] {
  return values.filter((value) => !isLikelyNav(value));
}

type KeywordThemeShape = SignalAudit["keywordThemes"][number];

export function sanitizeKeywordThemes(themes: KeywordThemeShape[]): KeywordThemeShape[] {
  return themes
    .filter((theme) => !isLikelyNav(theme.theme))
    .map((theme) => ({ ...theme, phrases: stripNavLikeStrings(safeStrings(theme.phrases)) }))
    .filter((theme) => theme.phrases.length > 0);
}

// Strips nav fragments from a free-form text blob so downstream extractors
// (snippetAround, fallback markdown lines) cannot pull menu text near a real
// keyword. Works on substrings, not whole-string membership.
//
// Patterns it removes (case-insensitive, idempotent):
// - "Skip to content" / "Skip to main"
// - "Toggle navigation" / "Toggle menu"
// - "(Open|Close) (menu|navigation|search|cart|submenu)"
// - Runs of 2+ ALL-CAPS tokens (mega-menu category labels)
// - Bare nav words on their own boundaries ("Subscribe", "Sign in", ...)
//
// Whitespace is collapsed after substitution so the cleaned text reads
// naturally for snippet extraction.
export function stripNavFromText(text: string): string {
  if (!text) return text;
  let cleaned = text;
  cleaned = cleaned.replace(/\bskip to (?:content|main)\b/gi, " ");
  cleaned = cleaned.replace(/\btoggle (?:navigation|menu)\b/gi, " ");
  cleaned = cleaned.replace(/\b(?:open|close)\s+(?:menu|navigation|search|cart|submenu)\b/gi, " ");
  // Runs of 2+ all-caps tokens. Three+ is the prototypical case; we also strip
  // 2-runs because "MENU CART" alone is still nav, never prose.
  cleaned = cleaned.replace(/(?:\b[A-Z]{2,}\b\s+){1,}\b[A-Z]{2,}\b/g, " ");
  // Standalone nav words (whole-word). Conservative list — only words that
  // are nav 99% of the time.
  cleaned = cleaned.replace(/\b(?:Subscribe|Sign\s+in|Sign\s+up|Log\s+in|Log\s+out|Back\s+to\s+top|View\s+all|See\s+all|Read\s+more|Learn\s+more|Show\s+more|Toggle\s+sidebar)\b/gi, " ");
  return cleaned.replace(/\s+/g, " ").trim();
}

// Strips nav lines + nav substrings from a markdown blob produced by the
// report writer (or the deterministic renderer). Lines whose trimmed content
// reads as nav are dropped entirely; surviving lines have nav substrings
// scrubbed via stripNavFromText.
export function sanitizeMarkdown(markdown: string): string {
  if (!markdown) return markdown;
  const lines = markdown.split(/\r?\n/);
  const kept: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    // Drop bullets / paragraphs whose content reads as nav. Headings (####)
    // are kept verbatim — they come from the deterministic template.
    if (trimmed.startsWith("####")) {
      kept.push(line);
      continue;
    }
    const content = trimmed.replace(/^[-*]\s+/, "");
    if (content && isLikelyNav(content)) continue;
    kept.push(stripNavFromText(line));
  }
  return kept.join("\n");
}

function safeStrings(items: string[] | null | undefined): string[] {
  return Array.isArray(items) ? items.filter((item): item is string => typeof item === "string") : [];
}
