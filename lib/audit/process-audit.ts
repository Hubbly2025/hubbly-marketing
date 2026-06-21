import siteProfileVocab from "./site-profile-vocab.v1.json"

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
}

type ProvenanceTag = "measured" | "inferred" | "estimated" | "recommendation"

type SiteProfile = {
  domain: string
  scanned_at: string
  business_model: string | null
  buyer_type: string | null
  industry: string | null
  category: string | null
  positioning: {
    value: string | null
    source_span: string | null
  }
  provenance: Record<string, ProvenanceTag>
}

type SiteProfileValueInput = {
  business_model?: string | null
  buyer_type?: string | null
  category?: string | null
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
  business_model?: string
  buyer_type?: string
  category?: string
  positioning?: {
    value?: string | null
    source_span?: string | null
  }
  site_profile?: SiteProfile
  provenance?: Record<string, ProvenanceTag>
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

    if (scrapedContent.trim().length < 300) {
      const message = "We could not find enough readable content on that site. It may block automated tools or require JavaScript."
      log("warn", "scraping", message, {
        content_length: scrapedContent.trim().length,
        pages_scraped: scrapedPages.length,
        diagnostics: scrapeDiagnostics,
      })
      await updateAuditLead(supabase, auditId, {
        status: "failed",
        error_message: message,
        analysis: {
          error: message,
          audit_debug: {
            current_step: "manual_review",
            progress_percent: 100,
            logs,
            manual_review: {
              required: true,
              reason: "low_content",
            },
          },
        },
        completed_at: new Date().toISOString(),
      })
      return
    }

    await markProgress("analyzing", 45, "Analyzing GTM strategy with Claude", {
      content_length: scrapedContent.length,
      pages_scraped: scrapedPages.length,
    })

    let analysis: AuditAnalysis
    let manualReview: AuditDebugState["manual_review"] | undefined
    try {
      analysis = await analyzeWithClaude(scrapedContent, log)
    } catch (error) {
      const friendlyMessage = toFriendlyError(error)
      log("error", "analysis", friendlyMessage, { raw_error: getErrorMessage(error) })
      analysis = buildFallbackAnalysis(companyName, scrapedContent)
      manualReview = {
        required: true,
        reason: "Claude analysis failed. Fallback report generated for manual review.",
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
    const siteProfile = buildSiteProfile({
      domain: new URL(url).hostname.replace(/^www\./, ""),
      scannedAt: new Date().toISOString(),
      analysis: normalizedAnalysis,
      scrapedContent,
    })
    normalizedAnalysis.business_model = siteProfile.business_model ?? undefined
    normalizedAnalysis.buyer_type = siteProfile.buyer_type ?? undefined
    normalizedAnalysis.category = siteProfile.category ?? undefined
    normalizedAnalysis.positioning = siteProfile.positioning
    normalizedAnalysis.provenance = siteProfile.provenance
    normalizedAnalysis.site_profile = siteProfile

    const intentData = estimateIntentData(siteProfile)
    const gtmPlan = buildGtmPlan(normalizedAnalysis, intentData, companyName)

    await markProgress("complete", 100, manualReview ? "Fallback report ready for manual review" : "Audit report complete")
    await updateAuditLead(supabase, auditId, {
      status: "complete",
      error_message: manualReview?.reason ?? null,
      analysis: normalizedAnalysis,
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
    throw new AuditPipelineError("scrape_failed", "No website pages could be scraped", true)
  }

  log("info", "scraping", `Scraped ${pages.length} readable page${pages.length === 1 ? "" : "s"}`, {
    provider: scrapingBeeApiKey ? "scrapingbee" : "direct_fetch",
    diagnostics,
  })

  return { pages, diagnostics }
}

async function scrapePage(url: string, label: string, apiKey?: string) {
  let response: Response

  if (apiKey) {
    const scrapeUrl = new URL("https://app.scrapingbee.com/api/v1/")
    scrapeUrl.searchParams.set("api_key", apiKey)
    scrapeUrl.searchParams.set("url", url)
    scrapeUrl.searchParams.set("render_js", "false")
    scrapeUrl.searchParams.set("block_ads", "true")
    scrapeUrl.searchParams.set("block_resources", "true")

    response = await fetch(scrapeUrl.toString(), {
      signal: AbortSignal.timeout(15000),
    })
  } else {
    response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HubblyBot/1.0)",
      },
      signal: AbortSignal.timeout(5000),
    })
  }

  if (!response.ok) {
    if (response.status === 404 || response.status === 410) {
      return null
    }
    throw new AuditPipelineError("scrape_http_error", `${label} returned HTTP ${response.status}`, response.status >= 500)
  }

  const html = await response.text()
  const title = extractTagContent(html, "title")
  const ogSiteName = extractMetaContent(html, "og:site_name")
  const content = extractReadableText(html)

  if (!content.trim()) {
    return null
  }

  return {
    label,
    url,
    title,
    ogSiteName,
    content: content.slice(0, 2000),
    status: response.status,
  }
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
) {
  const firstPrompt = buildAnalysisPrompt(scrapedContent)

  try {
    return validateAnalysis(await withRetry(
      "claude analysis",
      () => callClaude(firstPrompt),
      { retries: 2, baseDelayMs: 900 },
      log,
    ))
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
    ))
  }
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
  "business_model": "Detected business model such as b2b_saas, b2b_services, local_service, b2c_ecommerce, marketplace, or other",
  "buyer_type": "Detected primary buyer archetype: business or consumer",
  "category": "Normalized specific category, lowercase snake_case",
  "positioning": {
    "value": "One sentence describing the site's positioning",
    "source_span": "Exact copied source text from the website that supports the positioning"
  },
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

function validateAnalysis(analysis: AuditAnalysis) {
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

function buildSiteProfile(params: {
  domain: string
  scannedAt: string
  analysis: AuditAnalysis
  scrapedContent: string
}): SiteProfile {
  const text = [
    params.analysis.product,
    params.analysis.industry,
    params.analysis.category,
    params.analysis.business_model,
    params.analysis.buyer_type,
    params.analysis.outreach_angle,
    getPrimaryIcpTitle(params.analysis),
    params.scrapedContent,
  ].filter(Boolean).join(" ").toLowerCase()
  const industry = normalizeText(params.analysis.industry)
  const directValues = normalizeSiteProfileValues({
    business_model: params.analysis.business_model,
    buyer_type: params.analysis.buyer_type,
    category: params.analysis.category,
  })
  const category = directValues.category ?? detectCategoryFromSignals(text, industry)
  const businessModel = normalizeBusinessModel(params.analysis.business_model)
    ?? detectBusinessModelFromSignals(text, normalizeBuyerType(params.analysis.buyer_type), category)
  const buyerType = normalizeBuyerType(params.analysis.buyer_type) ?? detectBuyerTypeFromSignals(text, businessModel, category)
  const positioningValue = normalizeText(params.analysis.positioning?.value)
    ?? normalizeText(params.analysis.outreach_angle)
    ?? normalizeText(params.analysis.product)
  const sourceSpan = normalizeText(params.analysis.positioning?.source_span)
    ?? findSourceSpan(positioningValue, params.scrapedContent)

  return {
    domain: params.domain,
    scanned_at: params.scannedAt,
    business_model: businessModel,
    buyer_type: buyerType,
    industry,
    category,
    positioning: {
      value: positioningValue,
      source_span: sourceSpan,
    },
    provenance: {
      domain: "measured",
      scanned_at: "measured",
      business_model: businessModel ? "inferred" : "estimated",
      buyer_type: buyerType ? "inferred" : "estimated",
      industry: industry ? "inferred" : "estimated",
      category: category ? "inferred" : "estimated",
      positioning: sourceSpan ? "inferred" : "estimated",
    },
  }
}

function estimateIntentData(siteProfile: SiteProfile) {
  const category = siteProfile.category

  if (!category) {
    return {
      status: "insufficient_signal",
      category: null,
      monthly: 0,
      weekly: 0,
      highIntent: 0,
      high_intent: 0,
      label: "Insufficient signal to estimate intent benchmarks for this site profile.",
      top_signals: [],
      geographies: [],
      provenance: {
        category: "estimated",
        monthly: "estimated",
        weekly: "estimated",
        highIntent: "estimated",
        top_signals: "estimated",
        geographies: "estimated",
      },
    }
  }

  const base = INTENT_ESTIMATES[category]
  if (!base) {
    return {
      status: "insufficient_signal",
      category,
      monthly: 0,
      weekly: 0,
      highIntent: 0,
      high_intent: 0,
      label: `Insufficient signal to estimate intent benchmarks for ${humanizeCategory(category)}.`,
      top_signals: buildIntentSignals(siteProfile),
      geographies: buildGeographies(siteProfile),
      provenance: {
        category: "inferred",
        monthly: "estimated",
        weekly: "estimated",
        highIntent: "estimated",
        top_signals: "inferred",
        geographies: "estimated",
      },
    }
  }

  const monthly = withVariance(base.monthly)
  const weekly = withVariance(base.weekly)
  const highIntent = withVariance(base.highIntent)

  return {
    status: "estimated",
    category,
    monthly,
    weekly,
    highIntent,
    high_intent: highIntent,
    label: `Estimated from Hubbly category benchmarks for ${humanizeCategory(category)} anchored on ${siteProfile.buyer_type ?? "insufficient signal"}.`,
    top_signals: buildIntentSignals(siteProfile),
    geographies: buildGeographies(siteProfile),
    provenance: {
      category: "inferred",
      monthly: "estimated",
      weekly: "estimated",
      highIntent: "estimated",
      top_signals: "inferred",
      geographies: "estimated",
    },
  }
}

function normalizeText(value?: string | null) {
  const normalized = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : ""
  return normalized || null
}

function getPrimaryIcpTitle(analysis: AuditAnalysis) {
  const primary = analysis.icp?.primary as { title?: string } | undefined
  return primary?.title
}

function normalizeCategory(value?: string | null) {
  return canonicalizeSiteProfileValue("categories", value)
}

function normalizeBuyerType(value?: string | null) {
  return canonicalizeSiteProfileValue("buyer_types", value)
}

function normalizeBusinessModel(value?: string | null) {
  return canonicalizeSiteProfileValue("business_models", value)
}

function normalizeSiteProfileValues(input: SiteProfileValueInput) {
  return {
    business_model: normalizeBusinessModel(input.business_model),
    buyer_type: normalizeBuyerType(input.buyer_type),
    category: normalizeCategory(input.category),
  }
}

function canonicalizeSiteProfileValue(
  field: "business_models" | "buyer_types" | "categories",
  value?: string | null,
) {
  const normalized = normalizeVocabValue(value)

  if (!normalized) return null

  for (const entry of siteProfileVocab[field]) {
    if (normalizeVocabValue(entry.slug) === normalized) return entry.slug
    if (entry.aliases.some((alias) => normalizeVocabValue(alias) === normalized)) return entry.slug
  }

  return null
}

function normalizeVocabValue(value?: string | null) {
  return normalizeText(value)?.toLowerCase().replace(/[_-]+/g, " ").replace(/[^a-z0-9\s]+/g, " ").replace(/\s+/g, " ").trim() ?? null
}

function detectCategoryFromSignals(value: string, industry?: string | null) {
  const combined = `${industry ?? ""} ${value}`.toLowerCase()

  if (/crab|seafood|restaurant|menu|reservation|dining/.test(combined)) return "seafood_restaurant"
  if (/payment|checkout|merchant|billing|payout|financial infrastructure/.test(combined)) return "payments"
  if (/insurance/.test(combined)) return "insurance"
  if (/mortgage|lending|loan/.test(combined)) return "mortgage"
  if (/real estate|housing|property/.test(combined)) return "real_estate"
  if (/recruit|talent|staffing|hiring/.test(combined)) return "recruiting"
  if (/solar/.test(combined)) return "solar"
  if (/home service|roof|plumb|hvac|contractor/.test(combined)) return "home_services"
  if (/commerce|retail|shop|consumer brand/.test(combined)) return "ecommerce"
  if (/agency|marketing/.test(combined)) return "marketing_agency"
  if (/health|medical|clinic/.test(combined)) return "healthcare"
  if (/finance|wealth|bank|ira|investment/.test(combined)) return "finance"
  if (/saas|software|platform|devtool|analytics|crm|api/.test(combined)) return "saas"

  return null
}

function detectBuyerTypeFromSignals(value: string, businessModel: string | null, category: string | null) {
  if (businessModel?.startsWith("b2b") || category === "payments") {
    return "business"
  }

  if (/restaurant|menu|reservation|near me|family|diner|consumer|patient|homeowner|personal/.test(value)) {
    return "consumer"
  }

  if (/business|company|team|enterprise|merchant|developer|revenue|marketing|sales|ops|head of|director|vp|cto|cfo|founder/.test(value)) {
    return "business"
  }

  return null
}

function detectBusinessModelFromSignals(value: string, buyerType: string | null, category: string | null) {
  if (category === "seafood_restaurant" || /restaurant|reservation|menu|dining/.test(value)) return "local_service"
  if (category === "payments" || /api|platform|software|saas|infrastructure/.test(value)) return "b2b_saas"
  if (/agency|consulting|services/.test(value) && buyerType === "business") return "b2b_services"
  if (/marketplace/.test(value)) return "marketplace"
  if (/shopify|storefront|ecommerce|retail/.test(value)) return "b2c_ecommerce"
  if (buyerType === "business") return "b2b_services"

  return buyerType === "consumer" ? "local_service" : null
}

function findSourceSpan(positioningValue: string | null, scrapedContent: string) {
  if (!positioningValue) return null

  const sentence = scrapedContent
    .split(/(?<=[.!?])\s+|\n+/)
    .map((line) => line.trim())
    .find((line) => {
      const lower = line.toLowerCase()
      return positioningValue
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 4)
        .slice(0, 5)
        .some((word) => lower.includes(word))
    })

  return sentence ? sentence.slice(0, 500) : null
}

function buildIntentSignals(siteProfile: SiteProfile) {
  const category = siteProfile.category

  if (!category) return []

  if (category === "payments") {
    return [
      "payments infrastructure pricing",
      "best payment API for online businesses",
      "payment processing software reviews",
      "Stripe alternatives for businesses",
      "payments platform for growing teams",
    ]
  }

  if (category === "seafood_restaurant") {
    return [
      "seafood restaurant near me",
      "crab shack menu",
      "seafood restaurant reservations",
      "best crab restaurant nearby",
      "family seafood restaurant",
    ]
  }

  if (siteProfile.buyer_type === "consumer" || siteProfile.business_model === "local_service") {
    const label = humanizeCategory(category)
    return [
      `${label} near me`,
      `${label} pricing`,
      `best ${label} nearby`,
      `${label} reviews`,
      `${label} booking`,
    ]
  }

  const label = humanizeCategory(category)
  return [
    `${label} pricing`,
    `best ${label} for ${siteProfile.buyer_type === "business" ? "businesses" : "buyers"}`,
    `${label} reviews`,
    `${label} alternatives`,
    `${label} solution`,
  ]
}

function humanizeCategory(category: string) {
  return category.replace(/_/g, " ")
}

function withVariance(value: number) {
  const variance = 0.15
  const factor = 1 + (Math.random() * variance * 2 - variance)
  return Math.round(value * factor)
}

function buildGeographies(siteProfile: SiteProfile) {
  if (!siteProfile.buyer_type || !siteProfile.business_model || !siteProfile.category) {
    return []
  }

  return []
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

export const buildSiteProfileForTest = buildSiteProfile
export const estimateIntentDataForTest = estimateIntentData
export const siteProfileVocabVersionForTest = siteProfileVocab.version
export const normalizeSiteProfileValuesForTest = normalizeSiteProfileValues
