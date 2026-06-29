export type ScrapedPage = {
  url: string;
  status: number;
  title: string | null;
  text: string;
  source: "plain_fetch" | "rendered";
};

const directFetchTimeoutMs = 12000;
const renderedFetchTimeoutMs = 15000;
const maxBodyBytes = 2 * 1024 * 1024;
const maxTextChars = 22000;
const minScrapeChars = 400;
export const minRealContentChars = 600;
export const scrapeTotalBudgetMs = directFetchTimeoutMs + renderedFetchTimeoutMs;
// Jina rendered fallback gets one retry on a transient error, but only while
// budget remains (i.e. tier 1 + the first attempt failed fast). A slow heavy
// site that already burned the budget is not retried, to protect maxDuration.
const maxJinaAttempts = 2;
const scrapeRetryBudgetMs = 12000;
const retryBackoffMs = 600;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type ExtractedHtml = {
  title: string | null;
  metaDescription: string | null;
  text: string;
};

type ScrapePageDiagnostic = {
  path: "plain_fetch";
  url: string;
  status: number;
  textLength: number;
  title: string | null;
  durationMs?: number;
  error?: string;
};

function logPageDiagnostic(diagnostic: ScrapePageDiagnostic): void {
  console.info("signal.scrape.page", diagnostic);
}

function logSummary(baseUrl: string, finalPath: string, durationMs: number, pages: ScrapedPage[] = []): void {
  console.info("signal.scrape.summary", {
    baseUrl,
    finalPath,
    durationMs,
    pages: pages.length,
    textLength: pages.reduce((total, page) => total + page.text.length, 0)
  });
}

function logFailure(domain: string, reason: string): void {
  console.warn("signal.scrape.failed", { domain, reason });
}

function logTier(domain: string, tier: 1 | 2, chars: number, outcome: string): void {
  console.warn("signal.scrape.tier", { domain, tier, chars, outcome });
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function decodeEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function collapseWhitespace(input: string): string {
  return decodeEntities(input).replace(/\s+/g, " ").trim();
}

// Permanently scrub skip-links and menu boilerplate that survive region
// stripping (e.g. "Skip to content"), so they never echo into the synthesis.
const boilerplatePhrases = /\b(?:skip to (?:main )?content|skip to navigation|skip navigation|skip to main|back to top|toggle (?:main )?menu|open menu|close menu|main menu|add to cart)\b/gi;

function stripBoilerplatePhrases(input: string): string {
  return input.replace(boilerplatePhrases, " ");
}

function cleanReadableText(input: string): string {
  return collapseWhitespace(stripBoilerplatePhrases(input)).slice(0, maxTextChars);
}

function removeNonContentRegions(html: string): string {
  return html
    .replace(/<head[\s\S]*?<\/head>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<aside[\s\S]*?<\/aside>/gi, " ");
}

function removeRepeatedNavLinkLists(html: string): string {
  return html.replace(/<(?:ul|ol|div)[^>]*(?:nav|menu|header|footer)[^>]*>[\s\S]*?<\/(?:ul|ol|div)>/gi, " ");
}

function metaContent(html: string, attribute: "name" | "property", value: string): string | null {
  const first =
    html.match(new RegExp(`<meta[^>]+${attribute}=["']${value}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i"))?.[1] ||
    html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+${attribute}=["']${value}["'][^>]*>`, "i"))?.[1] ||
    "";
  return collapseWhitespace(first) || null;
}

function collectReadableStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    const text = collapseWhitespace(value);
    if (isReadableFragment(text)) out.push(text);
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectReadableStrings(item, out));
    return out;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (/^(name|description|headline|articleBody|text|title)$/i.test(key)) {
        collectReadableStrings(item, out);
      } else if (typeof item === "object") {
        collectReadableStrings(item, out);
      }
    }
  }
  return out;
}

function isReadableFragment(text: string): boolean {
  if (text.length < 24) return false;
  if (/^https?:\/\//i.test(text)) return false;
  if (/^[a-f0-9_-]{16,}$/i.test(text)) return false;
  if (!/[a-z]/i.test(text) || !/\s/.test(text)) return false;
  return true;
}

function extractJsonLdStrings(html: string): string[] {
  return Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)).flatMap((match) => {
    try {
      return collectReadableStrings(JSON.parse(decodeEntities(match[1] || "")));
    } catch {
      return [];
    }
  });
}

function extractNextDataStrings(html: string): string[] {
  const nextData = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)?.[1];
  if (!nextData) return [];
  try {
    return collectReadableStrings(JSON.parse(decodeEntities(nextData)));
  } catch {
    return [];
  }
}

function extractNextFlightStrings(html: string): string[] {
  return Array.from(html.matchAll(/self\.__next_f\.push\(([\s\S]*?)\)(?:;|<\/script>)/gi)).flatMap((match) => {
    const script = decodeEntities(match[1] || "");
    return Array.from(script.matchAll(/"((?:[^"\\]|\\.){24,})"/g))
      .map((stringMatch) => collapseWhitespace(stringMatch[1].replace(/\\"/g, '"').replace(/\\n/g, " ")))
      .filter(isReadableFragment);
  });
}

function stripHtml(html: string): ExtractedHtml {
  const title = collapseWhitespace(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "") || null;
  const metaDescription = metaContent(html, "name", "description");
  const ogTitle = metaContent(html, "property", "og:title");
  const ogDescription = metaContent(html, "property", "og:description");
  const embeddedStrings = [...extractJsonLdStrings(html), ...extractNextDataStrings(html), ...extractNextFlightStrings(html)];
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || html;
  const cleaned = removeRepeatedNavLinkLists(removeNonContentRegions(body));
  const bodyText = collapseWhitespace(cleaned.replace(/<[^>]+>/g, " "));
  const pieces = [title, metaDescription, ogTitle, ogDescription, ...embeddedStrings, bodyText].filter(Boolean);

  return {
    title,
    metaDescription,
    text: cleanReadableText(pieces.join(" "))
  };
}

async function readTextBodyCapped(response: Response): Promise<string> {
  if (!response.body) {
    return (await response.text()).slice(0, maxBodyBytes);
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (received < maxBodyBytes) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    const remaining = maxBodyBytes - received;
    const chunk = value.byteLength > remaining ? value.slice(0, remaining) : value;
    chunks.push(chunk);
    received += chunk.byteLength;
    if (value.byteLength > remaining) {
      await reader.cancel().catch(() => undefined);
      break;
    }
  }

  return new TextDecoder().decode(Buffer.concat(chunks));
}

async function fetchWithHardTimeout(url: string, timeoutMs: number, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const request = fetch(url, {
      ...init,
      signal: controller.signal,
      headers: init.headers
    });
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
        reject(new Error("fetch_timeout"));
      }, timeoutMs);
    });
    return await Promise.race([request, timeout]);
  } catch (error) {
    if (timedOut) throw new Error("fetch_timeout");
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function fetchHtml(url: string): Promise<{ response: Response; html: string }> {
  const response = await fetchWithHardTimeout(url, directFetchTimeoutMs, {
    method: "GET",
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; HubblySignal/1.0; +https://hubbly.io)",
      accept: "text/html,application/xhtml+xml"
    }
  });
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("text/html")) {
    throw new Error("non_html_response");
  }
  return { response, html: await readTextBodyCapped(response) };
}

async function fetchRenderedText(baseUrl: string): Promise<{ response: Response; text: string }> {
  const headers: Record<string, string> = {
    accept: "text/plain",
    "x-return-format": "text"
  };
  if (process.env.JINA_API_KEY) {
    headers.authorization = `Bearer ${process.env.JINA_API_KEY}`;
  }
  const response = await fetchWithHardTimeout(`https://r.jina.ai/${baseUrl}`, renderedFetchTimeoutMs, {
    method: "GET",
    headers
  });
  return { response, text: await readTextBodyCapped(response) };
}

function titleFromRenderedText(text: string): string | null {
  const firstLine = text.split(/\r?\n/).map((line) => collapseWhitespace(line.replace(/^#+\s*/, ""))).find(Boolean);
  return firstLine?.slice(0, 160) || null;
}

export async function scrapeSite(baseUrl: string): Promise<ScrapedPage[]> {
  const startedAt = Date.now();
  const domain = extractDomain(baseUrl);
  let tierOnePage: ScrapedPage | null = null;

  try {
    const { response, html } = await fetchHtml(baseUrl);
    const extracted = stripHtml(html);
    tierOnePage = {
      url: baseUrl,
      status: response.status,
      title: extracted.title,
      text: response.ok ? extracted.text : "",
      source: "plain_fetch"
    };

    logPageDiagnostic({
      path: "plain_fetch",
      url: baseUrl,
      status: response.status,
      textLength: tierOnePage.text.length,
      title: tierOnePage.title,
      durationMs: Date.now() - startedAt
    });

    if (tierOnePage.text.length >= minScrapeChars) {
      logTier(domain, 1, tierOnePage.text.length, "success");
      logSummary(baseUrl, "plain_fetch", Date.now() - startedAt, [tierOnePage]);
      return [tierOnePage];
    }
    logTier(domain, 1, tierOnePage.text.length, "thin");
  } catch (error) {
    const reason =
      error instanceof Error && (error.name === "AbortError" || error.message === "fetch_timeout")
        ? "fetch_timeout"
        : error instanceof Error
          ? error.message
          : "fetch_error";
    logFailure(domain, reason);
    logTier(domain, 1, 0, reason);
    logPageDiagnostic({
      path: "plain_fetch",
      url: baseUrl,
      status: 0,
      textLength: 0,
      title: null,
      durationMs: Date.now() - startedAt,
      error: reason
    });
  }

  console.info("signal.scrape.fallback", { domain, tier: 2, used: true, reason: "tier1_thin_or_failed" });
  for (let attempt = 1; attempt <= maxJinaAttempts; attempt++) {
    try {
      const { response, text } = await fetchRenderedText(baseUrl);
      const renderedText = cleanReadableText(text);
      const page: ScrapedPage = {
        url: baseUrl,
        status: response.status,
        title: tierOnePage?.title || titleFromRenderedText(text),
        text: response.ok ? renderedText : "",
        source: "rendered"
      };
      if (page.text.length >= minScrapeChars) {
        logTier(domain, 2, page.text.length, attempt > 1 ? "success_retry" : "success");
        logSummary(baseUrl, "rendered", Date.now() - startedAt, [page]);
        return [page];
      }
      logTier(domain, 2, page.text.length, "thin");
      break; // Thin rendered content is unlikely to change on a retry.
    } catch (error) {
      const reason =
        error instanceof Error && (error.name === "AbortError" || error.message === "fetch_timeout")
          ? "fetch_timeout"
          : error instanceof Error
            ? error.message
            : "fetch_error";
      logFailure(domain, reason);
      logTier(domain, 2, 0, reason);
      const elapsed = Date.now() - startedAt;
      if (attempt < maxJinaAttempts && elapsed <= scrapeRetryBudgetMs) {
        console.info("signal.scrape.retry", { domain, tier: 2, nextAttempt: attempt + 1, elapsedMs: elapsed });
        await delay(retryBackoffMs);
        continue;
      }
      break;
    }
  }

  logSummary(baseUrl, "not_enough_signal", Date.now() - startedAt);
  return [];
}
