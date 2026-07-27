import { runSignalAudit } from "@/lib/seo-report/pipeline"
import { assertPublicHttpUrl } from "@/lib/seo-report/url-guard"
import type { SeoReport } from "@/lib/seo-report/types"

const DEFAULT_SUPABASE_URL = "https://fqsnvqkorwiwclbkscuj.supabase.co"

const SCRAPE_PATHS = [
  { path: "/", label: "homepage" },
  { path: "/about", label: "about" },
  { path: "/pricing", label: "pricing" },
  { path: "/product", label: "product" },
  { path: "/features", label: "features" },
  { path: "/customers", label: "customers" },
] as const

const INTENT_ESTIMATES: Record<string, { monthly: number; weekly: number; highIntent: number }> = {
  saas: { monthly: 4200, weekly: 1100, highIntent: 380 },
  insurance: { monthly: 8900, weekly: 2400, highIntent: 720 },
  mortgage: { monthly: 6200, weekly: 1600, highIntent: 490 },
  real_estate: { monthly: 7400, weekly: 1900, highIntent: 560 },
  recruiting: { monthly: 3800, weekly: 980, highIntent: 290 },
  solar: { monthly: 5100, weekly: 1300, highIntent: 420 },
  home_services: { monthly: 9200, weekly: 2500, highIntent: 740 },
  ecommerce: { monthly: 11000, weekly: 2900, highIntent: 890 },
  marketing_agency: { monthly: 2900, weekly: 750, highIntent: 210 },
  healthcare: { monthly: 6800, weekly: 1800, highIntent: 530 },
  finance: { monthly: 5500, weekly: 1400, highIntent: 440 },
  default: { monthly: 3500, weekly: 900, highIntent: 280 },
}

type ScrapedPage = {
  label: string
  url: string
  title: string | null
  ogSiteName: string | null
  content: string
  status: number
}

type AuditAnalysis = {
  company_name?: string
  product?: string
  industry?: string
  icp?: Record<string, unknown>
  competitors?: Array<Record<string, unknown>>
  gtm_gaps?: string[]
  outreach_angle?: string
  sample_email?: Record<string, unknown>
}

type AuditDebugLog = {
  at: string
  level: "info" | "warn" | "error"
  step: string
  message: string
  detail?: Record<string, unknown>
}

type AuditDebugState = {
  current_step: string
  progress_percent: number
  logs: AuditDebugLog[]
  manual_review?: {
    required: boolean
    reason: string
  }
}

export async function processAudit(auditId: string, url: string) {
  const supabase = getSupabaseConfig()
  const logs: AuditDebugLog[] = []
  let currentStep = "Starting audit"
  let progressPercent = 5

  const log = (level: AuditDebugLog["level"], step: string, message: string, detail?: Record<string, unknown>) => {
    const entry = { at: new Date().toISOString(), level, step, message, detail }
    logs.push(entry)
    console.log(`[audit:${auditId}] ${level.toUpperCase()} ${step}: ${message}`, detail ?? "")
  }

  const markProgress = async (step: string, progress: number, message: string, detail?: Record<string, unknown>) => {
    currentStep = step
    progressPercent = progress
    log("info", step, message, detail)
    await updateAuditDebug(supabase, auditId, { current_step: currentStep, progress_percent: progressPercent, logs })
  }

  try {
    await markProgress("queued", 5, "Audit job accepted")
    await markProgress("scraping", 15, "Scraping website content")
    const { pages: scrapedPages, diagnostics: scrapeDiagnostics } = await scrapeWebsiteDeep(url, log)
    const companyName = extractCompanyName(scrapedPages, url)
    const scrapedContent = formatScrapedContent(scrapedPages, companyName)
    const hasMarketingScrape = scrapedPages.some((page) => page.content.trim().length > 0)

    // Lower threshold and allow partial audits with limited content
    const contentLength = hasMarketingScrape ? scrapedContent.trim().length : 0
    const isLowContent = contentLength < 150
    let manualReview: AuditDebugState["manual_review"] | undefined

    if (!hasMarketingScrape) {
      log("warn", "scraping", "GTM analysis limited — site blocked automated reads; SEO intelligence will run via fallback pipeline.", {
        content_length: contentLength,
        pages_scraped: scrapedPages.length,
        diagnostics: scrapeDiagnostics,
      })
      manualReview = {
        required: true,
        reason: "GTM analysis limited — site blocked automated reads; SEO intelligence ran via fallback pipeline.",
      }
    } else if (isLowContent) {
      log("warn", "scraping", "Limited content extracted, will generate partial audit", {
        content_length: contentLength,
        pages_scraped: scrapedPages.length,
        diagnostics: scrapeDiagnostics,
      })
      manualReview = {
        required: true,
        reason: "Limited website content available. Partial audit generated based on available metadata.",
      }
    }

    await markProgress("analyzing", 45, hasMarketingScrape ? "Analyzing GTM strategy with Claude" : "Skipping GTM strategy analysis; no marketing scrape text", {
      content_length: scrapedContent.length,
      pages_scraped: scrapedPages.length,
    })

    let analysis: AuditAnalysis
    if (!hasMarketingScrape) {
      analysis = buildBlockedMarketingAnalysis(companyName)
    } else {
      try {
        // Use a simplified prompt if we have very little content
        analysis = await analyzeWithClaude(scrapedContent, log, isLowContent)
      } catch (error) {
        const friendlyMessage = toFriendlyError(error)
        log("error", "analysis", friendlyMessage, { raw_error: getErrorMessage(error) })
        analysis = buildFallbackAnalysis(companyName, scrapedContent)
        manualReview = {
          required: true,
          reason: manualReview?.reason
            ? `${manualReview.reason} Claude analysis also failed.`
            : "Claude analysis failed. Fallback report generated for manual review.",
        }
      }
    }

    await markProgress("building_report", 75, "Building GTM report data")
    const normalizedAnalysis = {
      ...analysis,
      company_name: analysis.company_name || companyName,
      audit_debug: {
        current_step: "complete",
        progress_percent: 100,
        logs,
        manual_review: manualReview,
      },
    }
    const intentData = hasMarketingScrape ? estimateIntentData(normalizedAnalysis.industry) : buildLimitedIntentData()
    const gtmPlan = buildGtmPlan(normalizedAnalysis, intentData, companyName)

    // Signal SEO report runs as a separate pass. Failure is non-fatal — a Signal
    // error must not fail the marketing audit. If it throws (including the
    // pipeline's own persistAudit to signal_audits), we log and proceed without
    // an seo_report field.
    let seoReport: SeoReport | undefined
    let signalUsable = false
    try {
      const signalResult = await runSignalAudit(url)
      seoReport = signalResult.audit.seoReport
      signalUsable = hasUsableSignalAudit(signalResult.audit)
    } catch (error) {
      log("warn", "seo_report", "Signal SEO report failed; continuing without it", {
        error: getErrorMessage(error),
      })
    }

    if (!hasMarketingScrape && !signalUsable) {
      throw new AuditPipelineError("scrape_failed", "Both marketing and SEO fallback scrapers failed to read the site", true)
    }

    await markProgress("complete", 100, manualReview ? "Fallback report ready for manual review" : "Audit report complete")
    await updateAuditLead(supabase, auditId, {
      status: "complete",
      error_message: manualReview?.reason ?? null,
      analysis: { ...normalizedAnalysis, seo_report: seoReport },
      competitors: normalizedAnalysis.competitors ?? [],
      intent_data: intentData,
      gtm_plan: gtmPlan,
      sample_email: normalizedAnalysis.sample_email ?? null,
      completed_at: new Date().toISOString(),
    })
  } catch (error) {
    const friendlyMessage = toFriendlyError(error)
    log("error", currentStep, friendlyMessage, { raw_error: getErrorMessage(error) })
    await updateAuditLead(supabase, auditId, {
      status: "failed",
      error_message: friendlyMessage,
      analysis: {
        error: friendlyMessage,
        audit_debug: {
          current_step: "failed",
          progress_percent: progressPercent,
          logs,
          manual_review: {
            required: true,
            reason: getErrorMessage(error),
          },
        },
      },
      completed_at: new Date().toISOString(),
    })
  }
}

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured")
  }

  return { url, serviceRoleKey }
}

async function updateAuditLead(
  supabase: { url: string; serviceRoleKey: string },
  auditId: string,
  payload: Record<string, unknown>,
) {
  const response = await fetch(`${supabase.url}/rest/v1/audit_leads?id=eq.${encodeURIComponent(auditId)}`, {
    method: "PATCH",
    headers: {
      apikey: supabase.serviceRoleKey,
      Authorization: `Bearer ${supabase.serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Audit update failed: ${response.status} ${await response.text()}`)
  }
}

async function updateAuditDebug(
  supabase: { url: string; serviceRoleKey: string },
  auditId: string,
  debug: AuditDebugState,
) {
  try {
    await updateAuditLead(supabase, auditId, {
      analysis: { audit_debug: debug },
    })
  } catch (error) {
    console.log(`[audit:${auditId}] WARN progress_update: ${getErrorMessage(error)}`)
  }
}

async function scrapeWebsiteDeep(
  url: string,
  log: (level: AuditDebugLog["level"], step: string, message: string, detail?: Record<string, unknown>) => void,
) {
  const base = new URL(url)

  // SSRF guard: `url` originates from an unauthenticated public form, and the
  // direct-fetch path below returns the response body into the audit report the
  // submitter can read. Without this check an attacker can make the server read
  // internal services and cloud metadata (e.g. 169.254.169.254) and have the
  // contents handed back to them.
  //
  // Matches the convention in lib/seo-report/scrape.ts: on a blocked URL we
  // degrade to an empty scrape rather than throwing, so the audit still
  // completes and no internal request is ever issued.
  try {
    await assertPublicHttpUrl(url)
  } catch (error) {
    log("warn", "scraping", "audit.scrape.blocked_url", { reason: getErrorMessage(error) })
    return { pages: [] as ScrapedPage[], diagnostics: [] }
  }

  const scrapingBeeApiKey = process.env.SCRAPINGBEE_API_KEY || process.env.Scrapingbee
  
  const scrapeResults = await Promise.allSettled(SCRAPE_PATHS.map(async (target) => {
    const targetUrl = new URL(target.path, base).toString()
    return withRetry(
      `scrape ${target.label}`,
      () => scrapePage(targetUrl, target.label, scrapingBeeApiKey),
      { retries: 2, baseDelayMs: 500, shouldRetry: (error) => !/404|410/.test(getErrorMessage(error)) },
      log,
    )
  }))
  const diagnostics = scrapeResults.map((result, index) => ({
    path: SCRAPE_PATHS[index].path,
    label: SCRAPE_PATHS[index].label,
    status: result.status,
    ok: result.status === "fulfilled" && Boolean(result.value),
    error: result.status === "rejected" ? getErrorMessage(result.reason) : undefined,
  }))
  const pages = scrapeResults
    .filter((result): result is PromiseFulfilledResult<ScrapedPage | null> => result.status === "fulfilled")
    .map((result) => result.value)
    .filter((page): page is ScrapedPage => Boolean(page))

  if (!pages.length) {
    log("warn", "scraping", "audit.scrape.empty_marketing_continuing", {
      provider: scrapingBeeApiKey ? "scrapingbee" : "direct_fetch",
      diagnostics,
    })
    return { pages, diagnostics }
  }

  log("info", "scraping", `Scraped ${pages.length} readable page${pages.length === 1 ? "" : "s"}`, {
    provider: scrapingBeeApiKey ? "scrapingbee" : "direct_fetch",
    diagnostics,
  })

  return { pages, diagnostics }
}

// Browser-like user agents to avoid bot detection
const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
]

async function scrapePage(url: string, label: string, apiKey?: string): Promise<ScrapedPage | null> {
  let html: string | null = null
  let responseStatus = 200

  // Try ScrapingBee first if API key is available
  if (apiKey) {
    try {
      html = await scrapeWithScrapingBee(url, apiKey)
    } catch {
      // ScrapingBee failed, will try direct fetch
    }
  }

  // Fallback to direct fetch with multiple strategies
  if (!html) {
    html = await scrapeWithDirectFetch(url)
  }

  if (!html) {
    return null
  }

  // Extract all available metadata
  const title = extractTagContent(html, "title")
  const ogSiteName = extractMetaContent(html, "og:site_name")
  const metaDescription = extractMetaContent(html, "description")
  const ogDescription = extractMetaContent(html, "og:description")
  const content = extractReadableText(html)

  // Build content from whatever we could extract
  const combinedContent = buildCombinedContent(content, title, metaDescription, ogDescription)

  if (!combinedContent.trim()) {
    return null
  }

  return {
    label,
    url,
    title,
    ogSiteName,
    content: combinedContent.slice(0, 2000),
    status: responseStatus,
  }
}

async function scrapeWithScrapingBee(url: string, apiKey: string): Promise<string | null> {
  const scrapeUrl = new URL("https://app.scrapingbee.com/api/v1/")
  scrapeUrl.searchParams.set("api_key", apiKey)
  scrapeUrl.searchParams.set("url", url)
  scrapeUrl.searchParams.set("render_js", "true")
  scrapeUrl.searchParams.set("block_ads", "true")
  scrapeUrl.searchParams.set("block_resources", "false")
  scrapeUrl.searchParams.set("wait", "3000")
  scrapeUrl.searchParams.set("premium_proxy", "true")

  const response = await fetch(scrapeUrl.toString(), {
    signal: AbortSignal.timeout(45000),
  })

  if (!response.ok) {
    return null
  }

  const html = await response.text()
  return html.length > 500 ? html : null
}

/**
 * fetch() with redirects followed manually so every hop is re-validated.
 *
 * `redirect: "follow"` would defeat the pre-flight SSRF guard: a public URL is
 * free to 302 to http://169.254.169.254/ and undici would follow it silently.
 * Each hop is re-checked with assertPublicHttpUrl, so a redirect into private
 * address space raises BlockedUrlError instead of being fetched.
 */
async function fetchFollowingSafeRedirects(
  url: string,
  init: RequestInit,
  maxRedirects = 5,
): Promise<Response> {
  let current = url

  for (let hop = 0; hop <= maxRedirects; hop++) {
    await assertPublicHttpUrl(current)

    const response = await fetch(current, { ...init, redirect: "manual" })

    const isRedirect = response.status >= 300 && response.status < 400
    const location = response.headers.get("location")
    if (!isRedirect || !location) return response

    // Resolve relative Location headers against the URL that produced them.
    current = new URL(location, current).toString()
  }

  throw new Error("too_many_redirects")
}

async function scrapeWithDirectFetch(url: string): Promise<string | null> {
  const parsedUrl = new URL(url)
  
  // Try different URL variations
  const urlVariations = [url]
  
  // Add www variant if not present, or remove if present
  if (parsedUrl.hostname.startsWith("www.")) {
    urlVariations.push(url.replace("://www.", "://"))
  } else {
    urlVariations.push(url.replace("://", "://www."))
  }

  for (const testUrl of urlVariations) {
    for (const userAgent of USER_AGENTS) {
      try {
        const response = await fetchFollowingSafeRedirects(testUrl, {
          headers: {
            "User-Agent": userAgent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
          },
          signal: AbortSignal.timeout(10000),
        })

        if (response.ok) {
          const html = await response.text()
          if (html.length > 500) {
            return html
          }
        }
      } catch {
        // Try next combination
        continue
      }
    }
  }

  return null
}

function buildCombinedContent(
  extractedContent: string,
  title: string | null,
  metaDescription: string | null,
  ogDescription: string | null
): string {
  const parts: string[] = []

  if (extractedContent.trim().length > 100) {
    parts.push(extractedContent)
  }

  // If main content extraction failed, use metadata as fallback
  if (parts.length === 0) {
    if (title) {
      parts.push(`Title: ${title}`)
    }
    if (metaDescription) {
      parts.push(`Description: ${metaDescription}`)
    }
    if (ogDescription && ogDescription !== metaDescription) {
      parts.push(`About: ${ogDescription}`)
    }
  }

  return parts.join("\n\n")
}

function extractTagContent(html: string, tag: string) {
  const match = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))
  return match ? decodeHtml(stripTags(match[1]).trim()) : null
}

function extractMetaContent(html: string, property: string) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const regex = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i")
  const match = html.match(regex)
  return match ? decodeHtml(match[1].trim()) : null
}

function extractHeadings(html: string) {
  const headings = Array.from(html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi))
    .map((match) => decodeHtml(stripTags(match[1]).trim()))
    .filter(Boolean)

  return headings.join("\n")
}

function extractReadableText(html: string) {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
  const headings = extractHeadings(withoutScripts)
  const ctas = Array.from(withoutScripts.matchAll(/<(?:a|button)[^>]*>([\s\S]*?)<\/(?:a|button)>/gi))
    .map((match) => decodeHtml(stripTags(match[1]).trim()))
    .filter((text) => text.length > 1)
    .slice(0, 25)
    .join("\n")
  const text = decodeHtml(stripTags(withoutScripts))
    .replace(/\s+/g, " ")
    .trim()

  return [`Headings:\n${headings}`, `CTA language:\n${ctas}`, `Page text:\n${text}`].join("\n\n")
}

function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, " ")
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
}

function extractCompanyName(pages: ScrapedPage[], url: string) {
  const homepage = pages.find((page) => page.label === "homepage") ?? pages[0]
  const fromOg = homepage?.ogSiteName?.trim()

  if (fromOg) {
    return cleanCompanyName(fromOg)
  }

  if (homepage?.title) {
    return cleanCompanyName(homepage.title.split(/\s[|–—-]\s/)[0] || homepage.title)
  }

  return cleanCompanyName(new URL(url).hostname.replace(/^www\./, "").split(".")[0])
}

function cleanCompanyName(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\b(home|official site|homepage)\b/gi, "")
    .trim()
}

function formatScrapedContent(pages: ScrapedPage[], companyName: string) {
  return [
    `Detected company name: ${companyName}`,
    ...pages.map((page) => [
      `--- ${page.label.toUpperCase()} ---`,
      `URL: ${page.url}`,
      page.title ? `Title: ${page.title}` : "",
      page.ogSiteName ? `og:site_name: ${page.ogSiteName}` : "",
      page.content,
    ].filter(Boolean).join("\n")),
  ].join("\n\n").slice(0, 45000)
}

async function analyzeWithClaude(
  scrapedContent: string,
  log: (level: AuditDebugLog["level"], step: string, message: string, detail?: Record<string, unknown>) => void,
  isLowContent = false,
) {
  const firstPrompt = isLowContent 
    ? buildSimplifiedPrompt(scrapedContent)
    : buildAnalysisPrompt(scrapedContent)

  try {
    return validateAnalysis(await withRetry(
      "claude analysis",
      () => callClaude(firstPrompt),
      { retries: 2, baseDelayMs: 900 },
      log,
    ), isLowContent)
  } catch (error) {
    log("warn", "analysis", "Claude response failed validation, retrying with compact JSON prompt", {
      error: getErrorMessage(error),
    })
    const retryPrompt = `${firstPrompt}

Your previous response was not usable. Return only compact valid JSON with every required top-level key present: product, industry, icp, competitors, gtm_gaps, outreach_angle, sample_email.`
    return validateAnalysis(await withRetry(
      "claude compact retry",
      () => callClaude(retryPrompt),
      { retries: 1, baseDelayMs: 1200 },
      log,
    ), isLowContent)
  }
}

function buildSimplifiedPrompt(scrapedContent: string) {
  return `You are a senior GTM strategist. Based on limited website information, provide your best analysis.

Website content (limited):
${scrapedContent}

Even with limited information, provide your best educated guess for each field. Use industry knowledge to fill gaps.

Respond with JSON only:

{
  "company_name": "Best guess at company name from URL or content",
  "product": "Your best guess at what this company does",
  "industry": "Most likely industry based on available clues",
  "icp": {
    "primary": {
      "title": "Most likely buyer title for this type of business",
      "company_size": "Typical company size that buys this",
      "pain_point": "Common pain point in this industry",
      "trigger": "Typical buying trigger"
    },
    "secondary": { "title": "", "company_size": "", "pain_point": "", "trigger": "" },
    "emerging": { "title": "", "company_size": "", "pain_point": "", "trigger": "" }
  },
  "competitors": [
    {
      "name": "A likely competitor in this space",
      "their_angle": "Typical positioning",
      "their_weakness": "Common weakness",
      "your_opening": "Potential differentiation"
    }
  ],
  "gtm_gaps": ["Likely gap 1", "Likely gap 2", "Likely gap 3"],
  "outreach_angle": "Best guess at compelling outreach angle",
  "sample_email": {
    "subject": "Generic but relevant subject line",
    "body": "3 sentences: reference their likely situation, the pain, the outcome, one CTA."
  }
}

Note: This is a preliminary analysis based on limited data. Mark for follow-up.
Return valid JSON only.`
}

function buildAnalysisPrompt(scrapedContent: string) {
  return `You are a senior GTM strategist analyzing a company website to build a precise revenue intelligence report.

Website content:
${scrapedContent}

Respond with JSON only. Be extremely specific — no generic answers.

{
  "company_name": "Extract the actual company name from the site",
  "product": "Exact one-sentence description of what this product does",
  "industry": "Specific industry — not just software or services",
  "icp": {
    "primary": {
      "title": "Exact job title of primary buyer",
      "company_size": "Specific employee range",
      "pain_point": "Specific pain this product solves — one sentence",
      "trigger": "What makes them buy NOW"
    },
    "secondary": { "title": "", "company_size": "", "pain_point": "", "trigger": "" },
    "emerging": { "title": "", "company_size": "", "pain_point": "", "trigger": "" }
  },
  "competitors": [
    {
      "name": "Real competitor company name only",
      "their_angle": "What they claim in one sentence",
      "their_weakness": "Specific weakness from public reviews or positioning",
      "your_opening": "Specific angle to displace them"
    }
  ],
  "gtm_gaps": ["Specific gap 1", "Specific gap 2", "Specific gap 3", "Specific gap 4"],
  "outreach_angle": "The single most compelling angle for cold outreach to their ICP",
  "sample_email": {
    "subject": "Subject line under 50 chars — specific not generic",
    "body": "3-4 sentences. Line 1: specific reference to their industry or role. Line 2: the pain. Line 3: the outcome. Line 4: one CTA. Never use: I hope this finds you well, delve, reach out, touch base"
  }
}

Rules:
- Never say businesses or companies as the ICP — name the exact buyer title
- Only name real competitors that actually exist
- The sample email must reference something specific from their website
- Respond with valid JSON only — no text outside the JSON`
}

async function callClaude(prompt: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.Anthropic

  if (!apiKey) {
    throw new AuditPipelineError("missing_anthropic_key", "ANTHROPIC_API_KEY is not configured", false)
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    }),
  })

  if (!response.ok) {
    throw new AuditPipelineError("claude_http_error", `Claude analysis failed: ${response.status} ${await response.text()}`, response.status >= 500 || response.status === 429)
  }

  const data = await response.json()
  const text = data.content
    ?.filter((item: { type: string }) => item.type === "text")
    .map((item: { text: string }) => item.text)
    .join("\n")

  if (!text) {
    throw new AuditPipelineError("claude_empty_response", "Claude returned an empty analysis", true)
  }

  return parseJson(text)
}

function parseJson(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim()
  return JSON.parse(cleaned) as AuditAnalysis
}

function validateAnalysis(analysis: AuditAnalysis, isLenient = false) {
  // For low-content audits, be more lenient
  if (isLenient) {
    if (!analysis.product && !analysis.industry) {
      throw new AuditPipelineError("claude_invalid_json", "Claude response is missing basic analysis fields", true)
    }
    // Fill in missing fields with defaults for lenient validation
    analysis.competitors = analysis.competitors || []
    analysis.gtm_gaps = analysis.gtm_gaps || ["Needs more research"]
    analysis.sample_email = analysis.sample_email || { subject: "Quick question", body: "Would love to learn more about your needs." }
    return analysis
  }

  if (!analysis.product || !analysis.industry || !analysis.icp || !analysis.sample_email) {
    throw new AuditPipelineError("claude_invalid_json", "Claude response is missing required analysis fields", true)
  }

  if (!Array.isArray(analysis.competitors) || analysis.competitors.length < 1) {
    throw new AuditPipelineError("claude_invalid_json", "Claude response is missing competitor analysis", true)
  }

  if (!Array.isArray(analysis.gtm_gaps) || analysis.gtm_gaps.length < 1) {
    throw new AuditPipelineError("claude_invalid_json", "Claude response is missing GTM gaps", true)
  }

  return analysis
}

class AuditPipelineError extends Error {
  code: string
  retryable: boolean

  constructor(code: string, message: string, retryable: boolean) {
    super(message)
    this.name = "AuditPipelineError"
    this.code = code
    this.retryable = retryable
  }
}

async function withRetry<T>(
  label: string,
  operation: () => Promise<T>,
  options: {
    retries: number
    baseDelayMs: number
    shouldRetry?: (error: unknown) => boolean
  },
  log: (level: AuditDebugLog["level"], step: string, message: string, detail?: Record<string, unknown>) => void,
) {
  let lastError: unknown

  for (let attempt = 0; attempt <= options.retries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      const retryable = options.shouldRetry?.(error) ?? isRetryableError(error)
      const canRetry = retryable && attempt < options.retries

      log(canRetry ? "warn" : "error", "retry", `${label} failed${canRetry ? ", retrying" : ""}`, {
        attempt: attempt + 1,
        max_attempts: options.retries + 1,
        retryable,
        error: getErrorMessage(error),
      })

      if (!canRetry) break
      await sleep(options.baseDelayMs * 2 ** attempt)
    }
  }

  throw lastError
}

function isRetryableError(error: unknown) {
  if (error instanceof AuditPipelineError) return error.retryable
  const message = getErrorMessage(error).toLowerCase()
  return /timeout|timed out|network|fetch failed|429|500|502|503|504|rate limit/.test(message)
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function toFriendlyError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase()

  if (message.includes("anthropic") || message.includes("claude")) {
    return "The analysis engine had trouble reading the site. We queued this audit for manual review."
  }

  if (message.includes("scrape") || message.includes("fetch") || message.includes("timeout")) {
    return "We could not read enough of that website. It may block automated tools or require JavaScript."
  }

  if (message.includes("supabase") || message.includes("audit update")) {
    return "We had trouble saving the audit. Please try again in a minute."
  }

  return "We had trouble analyzing that URL. We queued it for manual review."
}

function buildFallbackAnalysis(companyName: string, scrapedContent: string): AuditAnalysis {
  const lower = scrapedContent.toLowerCase()
  const industry = inferIndustryFromContent(lower)

  return {
    company_name: companyName,
    product: `${companyName} appears to help customers in ${industry} solve a revenue or operational workflow problem based on its public website.`,
    industry,
    icp: {
      primary: {
        title: "Revenue leader",
        company_size: "25-250 employees",
        pain_point: "They need a clearer way to turn website interest into qualified pipeline.",
        trigger: "They are trying to increase qualified meetings without adding more manual sales headcount.",
      },
      secondary: {
        title: "Founder or owner",
        company_size: "1-50 employees",
        pain_point: "They need more predictable customer acquisition from their existing website and positioning.",
        trigger: "Growth has slowed or paid acquisition is getting harder to scale.",
      },
      emerging: {
        title: "Marketing leader",
        company_size: "50-500 employees",
        pain_point: "They need sharper targeting and better conversion from existing demand.",
        trigger: "They are reviewing campaign performance or launching a new GTM motion.",
      },
    },
    competitors: [
      {
        name: "Manual outbound teams",
        their_angle: "Human-led research and outreach.",
        their_weakness: "Slow execution, inconsistent targeting, and high operating cost.",
        your_opening: "Position around faster GTM execution with automated buyer identification and outreach.",
      },
    ],
    gtm_gaps: [
      "The public site does not provide enough machine-readable detail for a high-confidence GTM audit.",
      "The buyer segment needs manual confirmation before campaigns launch.",
      "Competitor displacement angles need human review.",
      "Outbound and follow-up motion should be mapped before execution.",
    ],
    outreach_angle: `Lead with the specific outcome ${companyName} promises and connect it to a near-term revenue trigger.`,
    sample_email: {
      subject: `${companyName} pipeline idea`,
      body: `Saw how ${companyName} is positioning around ${industry}. Teams in this market often lose demand because interest is not routed into follow-up fast enough. Hubbly can turn that website interest into targeted outreach and booked meetings. Worth mapping the first segment?`,
    },
  }
}

function buildBlockedMarketingAnalysis(companyName: string): AuditAnalysis {
  return {
    company_name: companyName,
    product: "GTM analysis limited — the marketing scraper could not read public website content.",
    industry: "Unknown",
    icp: {
      primary: {
        title: "Buyer to confirm",
        company_size: "Unknown",
        pain_point: "Public marketing content was not readable by the GTM scraper.",
        trigger: "Run SEO intelligence from the fallback pipeline first, then confirm GTM details manually.",
      },
      secondary: { title: "", company_size: "", pain_point: "", trigger: "" },
      emerging: { title: "", company_size: "", pain_point: "", trigger: "" },
    },
    competitors: [],
    gtm_gaps: ["GTM analysis limited because public marketing content was blocked."],
    outreach_angle: "Analysis pending until readable marketing content is available.",
    sample_email: {
      subject: "Analysis pending",
      body: "GTM analysis is limited because the public site blocked automated reads. Hubbly still ran the SEO fallback pipeline where available.",
    },
  }
}

function buildLimitedIntentData() {
  return {
    category: "insufficient_signal",
    monthly: 0,
    weekly: 0,
    highIntent: 0,
    high_intent: 0,
    label: "Demand data unavailable because the GTM scraper could not read public marketing content. SEO intelligence may still be available from the fallback pipeline.",
    top_signals: [],
    geographies: [],
  }
}

function hasUsableSignalAudit(audit: { status?: string; scrape?: { pagesRead?: unknown[] }; seoReport?: Partial<SeoReport> } | undefined) {
  if (!audit) return false
  if ((audit.scrape?.pagesRead ?? []).length > 0) return true
  const report = audit.seoReport
  if (!report) return false
  if (audit.status === "ready") return true
  if (report.dataforseoReturned) return true
  if (report.externalApiStatus === "measured") return true
  if ((report.keywordAnalysis?.clusters ?? []).length > 0) return true
  if ((report.gapKeywords ?? []).length > 0) return true
  return false
}

function inferIndustryFromContent(content: string) {
  if (/ecommerce|shopify|retail|storefront|consumer brand/.test(content)) return "Ecommerce Marketing Technology"
  if (/insurance|policy|coverage|carrier/.test(content)) return "Insurance"
  if (/mortgage|loan|lending|refinance/.test(content)) return "Mortgage"
  if (/real estate|property|brokerage/.test(content)) return "Real Estate"
  if (/recruiting|hiring|talent|staffing/.test(content)) return "Recruiting"
  if (/agency|marketing|creative|demand generation/.test(content)) return "Marketing Services"
  if (/software|platform|saas|api|automation/.test(content)) return "B2B SaaS"
  return "Revenue Technology"
}

function estimateIntentData(industry?: string) {
  const category = detectIntentCategory(industry)
  const base = INTENT_ESTIMATES[category] ?? INTENT_ESTIMATES.default
  const monthly = withVariance(base.monthly)
  const weekly = withVariance(base.weekly)
  const highIntent = withVariance(base.highIntent)

  return {
    category,
    monthly,
    weekly,
    highIntent,
    high_intent: highIntent,
    label: `Estimated based on Hubbly Data category benchmarks for ${industry || category}.`,
    top_signals: [
      `${category.replace(/_/g, " ")} pricing 2026`,
      `best ${category.replace(/_/g, " ")} for growing teams`,
      `${category.replace(/_/g, " ")} reviews`,
      `${category.replace(/_/g, " ")} alternatives`,
      `${category.replace(/_/g, " ")} solution`,
    ],
    geographies: buildGeographies(monthly),
  }
}

function detectIntentCategory(industry?: string) {
  const value = (industry ?? "").toLowerCase()

  if (/insurance/.test(value)) return "insurance"
  if (/mortgage|lending|loan/.test(value)) return "mortgage"
  if (/real estate|housing|property/.test(value)) return "real_estate"
  if (/recruit|talent|staffing|hiring/.test(value)) return "recruiting"
  if (/solar/.test(value)) return "solar"
  if (/home service|roof|plumb|hvac|contractor/.test(value)) return "home_services"
  if (/commerce|retail|shop|consumer brand/.test(value)) return "ecommerce"
  if (/agency|marketing/.test(value)) return "marketing_agency"
  if (/health|medical|clinic/.test(value)) return "healthcare"
  if (/finance|wealth|bank|ira|investment/.test(value)) return "finance"
  if (/saas|software|platform|devtool|analytics|crm/.test(value)) return "saas"

  return "default"
}

function withVariance(value: number) {
  const variance = 0.15
  const factor = 1 + (Math.random() * variance * 2 - variance)
  return Math.round(value * factor)
}

function buildGeographies(monthly: number) {
  const states = ["California", "Texas", "Florida", "New York", "Illinois"]
  const weights = [0.21, 0.17, 0.14, 0.11, 0.08]

  return states.map((state, index) => ({
    region: state,
    count: Math.max(1, Math.round(monthly * weights[index])),
  }))
}

function buildGtmPlan(analysis: AuditAnalysis, intentData: Record<string, unknown>, companyName: string) {
  const primaryIcp = analysis.icp?.primary as { title?: string; pain_point?: string } | undefined

  return {
    company_name: companyName,
    week_1: {
      icp_targeting: primaryIcp?.title
        ? `${primaryIcp.title} profiles matching the pain: ${primaryIcp.pain_point ?? analysis.outreach_angle}`
        : analysis.outreach_angle,
      data_sourcing: "Website-fit accounts, competitor search intent, and category research signals.",
      message_angle: analysis.outreach_angle,
    },
    week_2_3: {
      email: analysis.sample_email,
      voice: `Follow up on the same pain point ${companyName} solves, with one short call prompt.`,
      volume: `Prioritize the ${intentData.high_intent} highest-intent buyers first.`,
    },
    week_4: {
      test: "Compare pain-led subject lines against competitor-displacement subject lines.",
      double_down: "Increase volume on the highest reply segment.",
      expand: "Add the secondary ICP once the primary segment shows reply signal.",
    },
  }
}
