import siteProfileVocab from "./site-profile-vocab.v1.json"
import {
  createHubblyIntelligenceClient,
  type HubblyIntelligenceClient,
  type HubblyIntelligenceDomainPositions,
} from "./hubbly-intelligence"
import { normalizeAuditDomain, type ScanGuardMetadata } from "./scan-guards"
import { getScanModelConfig, SCAN_MODEL_POLICY, toPublicModelProvenance, type PublicScanModelProvenance, type ScanModelConfig } from "./scan-model-config"
import {
  enabledRankCapabilities,
  rankCapabilityById,
  type RankCapability,
} from "./rank-capabilities"
import { parse } from "node-html-parser"

const DEFAULT_SUPABASE_URL = "https://fqsnvqkorwiwclbkscuj.supabase.co"

const SCRAPE_PATHS = [
  { path: "/", label: "homepage" },
  { path: "/about", label: "about" },
  { path: "/pricing", label: "pricing" },
  { path: "/product", label: "product" },
  { path: "/features", label: "features" },
  { path: "/customers", label: "customers" },
] as const

type ProvenanceTag = "measured" | "inferred" | "estimated" | "recommendation"
type ProvenanceRecord = Record<string, ProvenanceTag | PublicScanModelProvenance>

type SiteProfile = {
  domain: string
  scanned_at: string
  business_model: string | null
  buyer_type: string | null
  industry: string | null
  category: string | null
  raw_category: string | null
  positioning: {
    value: string | null
    source_span: string | null
  }
  observed_evidence: ObservedEvidence
  provenance: ProvenanceRecord
  model_provenance?: PublicScanModelProvenance
}

type ObservedEvidence = {
  primary_cta_text: string | null
  h1: string | null
  key_headers: string[]
  detected_tech_stack: string[]
}

type SiteProfileValueInput = {
  business_model?: string | null
  buyer_type?: string | null
  category?: string | null
  raw_category?: string | null
}

type ScrapedPage = {
  label: string
  url: string
  title: string | null
  ogSiteName: string | null
  content: string
  observedEvidence: ObservedEvidence
  status: number
}

type AuditAnalysis = {
  company_name?: string
  product?: string
  industry?: string
  business_model?: string
  buyer_type?: string
  category?: string
  raw_category?: string
  positioning?: {
    value?: string | null
    source_span?: string | null
  }
  site_profile?: SiteProfile
  provenance?: ProvenanceRecord
  model_provenance?: PublicScanModelProvenance
  icp?: Record<string, unknown>
  competitors?: Array<Record<string, unknown>>
  gtm_gaps?: string[]
  outreach_angle?: string
  sample_email?: Record<string, unknown>
  game_plan?: RankGamePlan
  scan_guard?: Record<string, unknown>
}

type IntentData = {
  status?: string
  top_signals?: string[]
  keyword_volumes?: Array<{ keyword?: string; monthlyVolume?: number; valuePerClick?: number | null }>
}

type RankGamePlanMove = {
  title: string
  capability_id: string
  capability_label: string
  measured_gap: string
  plan: string
  why_this?: string
  provenance: "recommendation"
}

type RankGamePlan = {
  status: "recommendation" | "analysis_pending"
  label?: string
  reason?: string
  moves: RankGamePlanMove[]
  allowed_capability_ids: string[]
  capabilities: Array<Pick<RankCapability, "id" | "label" | "description" | "tier">>
  provenance: "recommendation"
  model_provenance: PublicScanModelProvenance
}

const ORGANIC_CTR_CURVE: Record<number, number> = {
  1: 0.285,
  2: 0.157,
  3: 0.11,
  4: 0.08,
  5: 0.072,
  6: 0.051,
  7: 0.04,
  8: 0.032,
  9: 0.028,
  10: 0.025,
}

const ORGANIC_CTR_CURVE_SOURCE = {
  name: "SISTRIX mobile average CTR curve",
  year: 2020,
  url: "https://www.sistrix.com/blog/why-almost-everything-you-knew-about-google-ctr-is-no-longer-valid/",
}

const COMPETITIVE_FORMULA_SOURCES = {
  search_volume: "Hubbly Intelligence ranked keyword volume",
  competitor_position: "Hubbly Intelligence SERP position",
  position_ctr: `${ORGANIC_CTR_CURVE_SOURCE.name} ${ORGANIC_CTR_CURVE_SOURCE.year}`,
  value_per_click: "Hubbly Intelligence keyword CPC",
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

export async function processAudit(auditId: string, url: string, scanGuard?: ScanGuardMetadata) {
  const supabase = getSupabaseConfig()
  const modelConfig = getScanModelConfig("free")
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
    const observedEvidence = mergeObservedEvidence(scrapedPages.map((page) => page.observedEvidence))

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

    await markProgress("analyzing", 45, "Analyzing GTM strategy with pinned synthesis model", {
      content_length: scrapedContent.length,
      pages_scraped: scrapedPages.length,
      model: modelConfig.model,
      model_version: modelConfig.version,
    })

    let analysis: AuditAnalysis
    let manualReview: AuditDebugState["manual_review"] | undefined
    try {
      analysis = await analyzeWithClaude(scrapedContent, log, modelConfig)
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
      scan_guard: scanGuard ? {
        domain: scanGuard.cacheDomain,
        cache_key: scanGuard.cacheKey,
        cache_ttl_seconds: scanGuard.cacheTtlSeconds,
        requested_at: scanGuard.requestedAt,
        rate_limit_key: scanGuard.rateLimitKey,
      } : undefined,
    }
    const siteProfile = buildSiteProfile({
      domain: normalizeAuditDomain(url),
      scannedAt: new Date().toISOString(),
      analysis: normalizedAnalysis,
      scrapedContent,
      observedEvidence,
    })
    normalizedAnalysis.business_model = siteProfile.business_model ?? undefined
    normalizedAnalysis.buyer_type = siteProfile.buyer_type ?? undefined
    normalizedAnalysis.category = siteProfile.category ?? siteProfile.raw_category ?? undefined
    normalizedAnalysis.raw_category = siteProfile.raw_category ?? undefined
    normalizedAnalysis.positioning = siteProfile.positioning
    normalizedAnalysis.provenance = {
      ...siteProfile.provenance,
      model: toPublicModelProvenance(modelConfig),
    }
    normalizedAnalysis.model_provenance = toPublicModelProvenance(modelConfig)
    normalizedAnalysis.site_profile = siteProfile

    const intelligenceClient = createHubblyIntelligenceClient()
    const intentData = await buildMeasuredIntentData(siteProfile, intelligenceClient)
    const competitiveIntelligence = await buildCompetitiveIntelligence(
      siteProfile,
      normalizedAnalysis.competitors ?? [],
      intentData,
      intelligenceClient,
    )
    const gamePlan = await buildConstrainedGamePlan({
      companyName,
      analysis: normalizedAnalysis,
      competitiveIntelligence,
      modelConfig,
      log,
    })
    normalizedAnalysis.game_plan = gamePlan

    await markProgress("complete", 100, manualReview ? "Fallback report ready for manual review" : "Audit report complete")
    await updateAuditLead(supabase, auditId, {
      status: "complete",
      error_message: manualReview?.reason ?? null,
      analysis: normalizedAnalysis,
      competitors: normalizedAnalysis.competitors ?? [],
      intent_data: intentData,
      competitive_intelligence: competitiveIntelligence,
      gtm_plan: gamePlan,
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
  const observedEvidence = extractObservedEvidence(html, response.headers)
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
    observedEvidence,
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

function extractObservedEvidence(html: string, headers: Headers): ObservedEvidence {
  const root = parse(html)
  const primaryCta = root
    .querySelectorAll("a, button")
    .map((node) => cleanObservedText(node.text))
    .find((text) => Boolean(text && isLikelyPrimaryCta(text))) ?? null
  const h1 = cleanObservedText(root.querySelector("h1")?.text) ?? null
  const keyHeaders = root
    .querySelectorAll("h1, h2, h3")
    .map((node) => cleanObservedText(node.text))
    .filter((text): text is string => Boolean(text))
    .slice(0, 8)
  const detectedTechStack = detectTechStack(root, headers)

  return {
    primary_cta_text: primaryCta,
    h1,
    key_headers: uniqueStrings(keyHeaders),
    detected_tech_stack: detectedTechStack,
  }
}

function mergeObservedEvidence(items: ObservedEvidence[]): ObservedEvidence {
  return {
    primary_cta_text: items.map((item) => item.primary_cta_text).find(Boolean) ?? null,
    h1: items.map((item) => item.h1).find(Boolean) ?? null,
    key_headers: uniqueStrings(items.flatMap((item) => item.key_headers)).slice(0, 8),
    detected_tech_stack: uniqueStrings(items.flatMap((item) => item.detected_tech_stack)),
  }
}

function cleanObservedText(value?: string | null) {
  const cleaned = decodeHtml(stripTags(value ?? ""))
    .replace(/\s+/g, " ")
    .trim()
  return cleaned || null
}

function isLikelyPrimaryCta(value: string) {
  return /\b(contact sales|get started|start now|book|schedule|request|demo|reserve|reservation|order|buy|shop|sign up|join|try)\b/i.test(value)
}

function detectTechStack(root: ReturnType<typeof parse>, headers: Headers) {
  const hasNextData = Boolean(root.querySelector("script#__NEXT_DATA__"))
  const scriptSources = root
    .querySelectorAll("script")
    .map((script) => script.getAttribute("src") ?? "")
    .join(" ")
  const linkHrefs = root
    .querySelectorAll("link")
    .map((link) => link.getAttribute("href") ?? "")
    .join(" ")
  const metaGenerator = root.querySelector("meta[name=\"generator\" i]")?.getAttribute("content") ?? ""
  const server = headers.get("server") ?? ""
  const poweredBy = headers.get("x-powered-by") ?? ""
  const vercel = headers.get("x-vercel-id") ?? ""
  const signals = `${scriptSources} ${linkHrefs} ${metaGenerator} ${server} ${poweredBy} ${vercel}`
  const detected: string[] = []

  if (hasNextData || /\/_next\/|next\.js/i.test(signals)) detected.push("Next.js")
  if (/\breact\b|react-dom/i.test(signals)) detected.push("React")
  if (/googletagmanager\.com|gtm\.js|gtag\/js/i.test(signals)) detected.push("Google Tag Manager")
  if (/google-analytics\.com|analytics\.js|gtag\/js/i.test(signals)) detected.push("Google Analytics")
  if (/segment\.com|segment\.io|analytics\.load/i.test(signals)) detected.push("Segment")
  if (/hubspot/i.test(signals)) detected.push("HubSpot")
  if (/shopify|cdn\.shopify\.com/i.test(signals)) detected.push("Shopify")
  if (/wordpress|wp-content|wp-includes/i.test(signals)) detected.push("WordPress")
  if (/webflow|assets\.website-files\.com/i.test(signals)) detected.push("Webflow")
  if (/vercel/i.test(signals)) detected.push("Vercel")
  if (/cloudflare/i.test(signals)) detected.push("Cloudflare")

  return uniqueStrings(detected)
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
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
  modelConfig: ScanModelConfig = getScanModelConfig("free"),
) {
  const firstPrompt = buildAnalysisPrompt(scrapedContent)

  try {
    return validateAnalysis(await withRetry(
      "claude analysis",
      () => callClaude(firstPrompt, modelConfig),
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
      () => callClaude(retryPrompt, modelConfig),
      { retries: 1, baseDelayMs: 1200 },
      log,
    ))
  }
}

function buildAnalysisPrompt(scrapedContent: string) {
  const categoryAllowlist = siteProfileVocab.categories.map((entry) => entry.slug).join(", ")

  return `You are a senior GTM strategist analyzing a company website to build a precise revenue intelligence report.

Website content:
${scrapedContent}

Canonical category allowlist:
${categoryAllowlist}

Respond with JSON only. Be extremely specific — no generic answers.

{
  "company_name": "Extract the actual company name from the site",
  "product": "Exact one-sentence description of what this product does",
  "industry": "Specific industry — not just software or services",
  "business_model": "Detected business model such as b2b_saas, b2b_services, local_service, b2c_ecommerce, marketplace, or other",
  "buyer_type": "Detected primary buyer archetype: business or consumer",
  "category": "Choose exactly one canonical category slug from the allowlist above. Use other only if none fit.",
  "raw_category": "The more specific category you infer from the page, lowercase snake_case, e.g. precious_metals_dealer or casual_seafood_restaurant",
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

async function callClaude(prompt: string, modelConfig: ScanModelConfig = getScanModelConfig("free")) {
  return callClaudeJson(prompt, modelConfig) as Promise<AuditAnalysis>
}

async function callClaudeJson(prompt: string, modelConfig: ScanModelConfig = getScanModelConfig("free")) {
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
      model: modelConfig.model,
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
  return JSON.parse(cleaned)
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
  observedEvidence?: ObservedEvidence
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
    raw_category: params.analysis.raw_category,
  })
  const rawCategory = normalizeText(params.analysis.raw_category) ?? normalizeText(params.analysis.category)
  const category = directValues.category
    ?? (hasConfidentSynthesisCategory(rawCategory) ? null : detectCategoryFromSignals(text, industry))
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
    raw_category: rawCategory,
    positioning: {
      value: positioningValue,
      source_span: sourceSpan,
    },
    observed_evidence: params.observedEvidence ?? emptyObservedEvidence(),
    provenance: {
      domain: "measured",
      scanned_at: "measured",
      business_model: businessModel ? "inferred" : "estimated",
      buyer_type: buyerType ? "inferred" : "estimated",
      industry: industry ? "inferred" : "estimated",
      category: category ? "inferred" : "estimated",
      raw_category: rawCategory ? "inferred" : "estimated",
      positioning: sourceSpan ? "inferred" : "estimated",
      observed_evidence: "measured",
      model: toPublicModelProvenance(getScanModelConfig("free")),
    },
    model_provenance: toPublicModelProvenance(getScanModelConfig("free")),
  }
}

function emptyObservedEvidence(): ObservedEvidence {
  return {
    primary_cta_text: null,
    h1: null,
    key_headers: [],
    detected_tech_stack: [],
  }
}

async function buildMeasuredIntentData(siteProfile: SiteProfile, client: HubblyIntelligenceClient) {
  const category = siteProfile.category ?? siteProfile.raw_category

  if (!category || !siteProfile.buyer_type || !siteProfile.business_model) {
    return insufficientIntentData(category)
  }

  try {
    const response = await client.fetchKeywordDemand({
      domain: siteProfile.domain,
      category,
      buyerType: siteProfile.buyer_type,
      businessModel: siteProfile.business_model,
    })
    const measuredKeywords = response.keywords
      .map((item) => ({
        keyword: normalizeIntentKeyword(item.keyword),
        monthlyVolume: Number.isFinite(item.monthlyVolume) ? Number(item.monthlyVolume) : null,
        competition: typeof item.competition === "string" ? item.competition : null,
        valuePerClick: Number.isFinite(item.valuePerClick) ? Number(item.valuePerClick) : null,
      }))
      .filter((item): item is { keyword: string; monthlyVolume: number; competition: string | null; valuePerClick: number | null } => Boolean(item.keyword) && Number(item.monthlyVolume) > 0)
      .sort((a, b) => b.monthlyVolume - a.monthlyVolume)

    if (!measuredKeywords.length) {
      return insufficientIntentData(category)
    }

    const monthly = measuredKeywords.reduce((sum, item) => sum + item.monthlyVolume, 0)
    const highIntent = calculateHighIntentVolume(measuredKeywords)

    return {
      status: "measured",
      category,
      monthly,
      highIntent,
      high_intent: highIntent,
      label: `Measured by Hubbly Intelligence for ${humanizeCategory(category)}.`,
      top_signals: measuredKeywords.slice(0, 5).map((item) => item.keyword),
      keyword_volumes: measuredKeywords.slice(0, 10),
      geographies: buildGeographies(siteProfile),
      cadence: {
        free: "on_demand",
        autopilot: "weekly",
        workforce: "daily",
      },
      provenance: {
        category: "inferred",
        monthly: "measured",
        highIntent: "measured",
        top_signals: "measured",
        keyword_volumes: "measured",
        geographies: "estimated",
      },
    }
  } catch (error) {
    logHubblyIntelligenceError("intent", error)
    return unavailableIntentData(category, error)
  }
}

function insufficientIntentData(category: string | null) {
  return {
    status: "insufficient_signal",
    category,
    monthly: 0,
    highIntent: 0,
    high_intent: 0,
    label: category
      ? `Hubbly Intelligence does not have measured demand data for ${humanizeCategory(category)} yet.`
      : "Hubbly Intelligence does not have enough profile signal to measure demand yet.",
    top_signals: [],
    keyword_volumes: [],
    geographies: [],
    cadence: {
      free: "on_demand",
      autopilot: "weekly",
      workforce: "daily",
    },
    provenance: {
      category: category ? "inferred" : "estimated",
      monthly: "estimated",
      highIntent: "estimated",
      top_signals: "estimated",
      keyword_volumes: "estimated",
      geographies: "estimated",
    },
  }
}

function unavailableIntentData(category: string | null, error: unknown) {
  return {
    status: "data_unavailable",
    category,
    monthly: 0,
    highIntent: 0,
    high_intent: 0,
    label: category
      ? `Hubbly Intelligence demand data for ${humanizeCategory(category)} is temporarily unavailable.`
      : "Hubbly Intelligence demand data is temporarily unavailable.",
    top_signals: [],
    keyword_volumes: [],
    geographies: [],
    error: vendorDataError(error),
    cadence: {
      free: "on_demand",
      autopilot: "weekly",
      workforce: "daily",
    },
    provenance: {
      category: category ? "inferred" : "estimated",
      monthly: "data_unavailable",
      highIntent: "data_unavailable",
      top_signals: "data_unavailable",
      keyword_volumes: "data_unavailable",
      geographies: "data_unavailable",
    },
  }
}

async function buildCompetitiveIntelligence(
  siteProfile: SiteProfile,
  namedCompetitors: Array<Record<string, unknown>>,
  intentData: IntentData,
  client: HubblyIntelligenceClient,
) {
  const priorityKeywords = priorityKeywordSet(intentData)
  const insufficient = () => insufficientCompetitiveIntelligence(priorityKeywords.length)
  const category = siteProfile.category ?? siteProfile.raw_category

  if (!category || !siteProfile.buyer_type || !siteProfile.business_model || !priorityKeywords.length) {
    return insufficient()
  }

  try {
    const competitorResponse = await client.fetchCompetitorSerpData({
      domain: siteProfile.domain,
      category,
      buyerType: siteProfile.buyer_type,
      businessModel: siteProfile.business_model,
      keywords: priorityKeywords,
    })
    const measuredDomains = competitorResponse.competitors
      .filter((item) => item.provenance === "measured" && item.domain)
      .slice(0, 3)
    const competitorDomains = measuredDomains.map((item) => item.domain)
    const positionsResponse = await client.fetchSerpPositions({
      domain: siteProfile.domain,
      category,
      buyerType: siteProfile.buyer_type,
      businessModel: siteProfile.business_model,
      keywords: priorityKeywords,
      competitorDomains,
    })

    const serpRankerDomains = selectSerpRankerDomains(positionsResponse.domains, siteProfile.domain, priorityKeywords)

    if (!serpRankerDomains.length) {
      return insufficient()
    }

    const competitivePositions = positionsResponse.domains.filter((item) =>
      item.domain === siteProfile.domain || serpRankerDomains.includes(item.domain),
    )

    const backlinkResponse = await client.fetchBacklinkSummaries({
      domain: siteProfile.domain,
      category,
      buyerType: siteProfile.buyer_type,
      businessModel: siteProfile.business_model,
      keywords: priorityKeywords,
      competitorDomains: serpRankerDomains,
    }).catch((error) => {
      logHubblyIntelligenceError("competitive_backlinks", error)
      return { summaries: [] }
    })

    const targetPositions = positionsResponse.domains.find((item) => item.domain === siteProfile.domain)
    const backlinkByDomain = new Map(backlinkResponse.summaries.map((item) => [item.domain, item]))
    const backlinkProvenance = backlinkByDomain.size ? "measured" as const : "data_unavailable" as const
    const measuredDomainByName = new Map(measuredDomains.map((item) => [item.domain, item]))
    const targetBacklinks = backlinkByDomain.get(siteProfile.domain)
    const targetShareOfVoice = calculateShareOfVoice(targetPositions, priorityKeywords)
    const serpRankers = serpRankerDomains.map((domain) => {
      const measuredDomain = measuredDomainByName.get(domain)
      const positions = positionsResponse.domains.find((item) => item.domain === domain)
      return {
        domain,
        kind: measuredDomain?.kind ?? (isMarketplaceDomain(domain) ? "marketplace" : "strategic_competitor"),
        label: measuredDomain?.label ?? (isMarketplaceDomain(domain) ? "marketplace ranking above you" : "SERP ranker"),
        intersections: measuredDomain?.intersections ?? null,
        avgPosition: measuredDomain?.avgPosition ?? averageMeasuredPosition(positions),
        provenance: "measured" as const,
      }
    })

    const battlefield = serpRankers
      .filter((domain) => domain.kind === "strategic_competitor")
      .map((domain) => {
        const positions = positionsResponse.domains.find((item) => item.domain === domain.domain)
        const backlinks = backlinkByDomain.get(domain.domain)
        return {
          domain: domain.domain,
          label: domain.label,
          intersections: domain.intersections,
          avgPosition: domain.avgPosition,
          shareOfVoice: calculateShareOfVoice(positions, priorityKeywords),
          yourShareOfVoice: targetShareOfVoice,
          referringDomains: backlinks?.referringDomains ?? null,
          yourReferringDomains: targetBacklinks?.referringDomains ?? null,
          enrichment_provenance: backlinks ? "measured" as const : "data_unavailable" as const,
          domain_source: "measured" as const,
          narrative: matchNarrative(domain.domain, namedCompetitors),
          provenance: "measured" as const,
        }
      })

    const marketplaces = serpRankers
      .filter((domain) => domain.kind === "marketplace")
      .map((domain) => ({
        domain: domain.domain,
        label: domain.label,
        intersections: domain.intersections,
        shareOfVoice: calculateShareOfVoice(
          positionsResponse.domains.find((item) => item.domain === domain.domain),
          priorityKeywords,
        ),
        referringDomains: backlinkByDomain.get(domain.domain)?.referringDomains ?? null,
        enrichment_provenance: backlinkByDomain.has(domain.domain) ? "measured" as const : "data_unavailable" as const,
        domain_source: "measured" as const,
        provenance: "measured" as const,
      }))

    const keywordMetrics = keywordMetricMap(intentData)
    const bleeding = buildBleedingKeywords(competitivePositions, siteProfile.domain, priorityKeywords, keywordMetrics)
    const measuredNarrativeDomains = new Set(serpRankers.map((item) => item.domain))
    const diagnosis = buildCompetitiveDiagnosis({
      targetDomain: siteProfile.domain,
      measuredDomains: serpRankers,
      positions: competitivePositions,
      backlinkByDomain,
      priorityKeywords,
      targetShareOfVoice,
    })
    const cost = buildCompetitiveCost(bleeding, diagnosis.rows)

    return {
      status: battlefield.length || marketplaces.length || bleeding.length ? "measured" : "insufficient_signal",
      caps: {
        keyword_count: priorityKeywords.length,
        competitor_count: serpRankers.length,
        max_keywords: 5,
        max_competitors: 3,
      },
      battlefield,
      marketplaces,
      bleeding,
      bleedingMonthly: bleeding.reduce((sum, item) => sum + item.monthlyVolume, 0),
      diagnosis,
      cost,
      named_without_serp_presence: namedCompetitors.filter((item) => {
        const name = typeof item.name === "string" ? item.name : ""
        return name && !Array.from(measuredNarrativeDomains).some((domain) => narrativeMatchesDomain(domain, name))
      }),
      provenance: {
        competitor_domains: "measured",
        battlefield: "measured",
        marketplaces: marketplaces.length ? "measured" : "estimated",
        bleeding: bleeding.length ? "measured" : "estimated",
        backlinks: backlinkProvenance,
      },
    }
  } catch (error) {
    logHubblyIntelligenceError("competitive", error)
    return unavailableCompetitiveIntelligence(priorityKeywords.length, error)
  }
}

function insufficientCompetitiveIntelligence(keywordCount: number) {
  return {
    status: "insufficient_signal",
    caps: {
      keyword_count: keywordCount,
      competitor_count: 0,
      max_keywords: 5,
      max_competitors: 3,
    },
    battlefield: [],
    marketplaces: [],
    bleeding: [],
    bleedingMonthly: 0,
    named_without_serp_presence: [],
    provenance: {
      competitor_domains: "estimated",
      battlefield: "estimated",
      marketplaces: "estimated",
      bleeding: "estimated",
      backlinks: "estimated",
    },
  }
}

function unavailableCompetitiveIntelligence(keywordCount: number, error: unknown) {
  return {
    status: "data_unavailable",
    label: "Hubbly Intelligence competitive data is temporarily unavailable.",
    caps: {
      keyword_count: keywordCount,
      competitor_count: 0,
      max_keywords: 5,
      max_competitors: 3,
    },
    battlefield: [],
    marketplaces: [],
    bleeding: [],
    bleedingMonthly: 0,
    named_without_serp_presence: [],
    error: vendorDataError(error),
    provenance: {
      competitor_domains: "data_unavailable",
      battlefield: "data_unavailable",
      marketplaces: "data_unavailable",
      bleeding: "data_unavailable",
      backlinks: "data_unavailable",
    },
  }
}

function logHubblyIntelligenceError(section: string, error: unknown) {
  console.warn("[audit] Hubbly Intelligence data unavailable", {
    section,
    error: getErrorMessage(error),
    error_type: getErrorName(error),
  })
}

function vendorDataError(error: unknown) {
  return {
    type: getErrorName(error) === "TimeoutError" ? "vendor_timeout" : "vendor_error",
    message: getErrorName(error) === "TimeoutError"
      ? "Hubbly Intelligence timed out."
      : "Hubbly Intelligence data is temporarily unavailable.",
  }
}

function getErrorName(error: unknown) {
  if (error && typeof error === "object" && "name" in error && typeof error.name === "string") {
    return error.name
  }

  return error instanceof Error ? error.name : typeof error
}

function priorityKeywordSet(intentData: IntentData) {
  const keywordVolumes = Array.isArray(intentData.keyword_volumes) ? intentData.keyword_volumes : []
  const volumeKeywords = keywordVolumes
    .map((item) => normalizeIntentKeyword(item.keyword ?? ""))
    .filter(Boolean)
  const signalKeywords = (intentData.top_signals ?? [])
    .map((keyword) => normalizeIntentKeyword(keyword))
    .filter(Boolean)

  return uniqueStrings([...volumeKeywords, ...signalKeywords]).slice(0, 5)
}

function keywordMetricMap(intentData: IntentData) {
  const keywordVolumes = Array.isArray(intentData.keyword_volumes) ? intentData.keyword_volumes : []
  const metrics = new Map<string, { monthlyVolume: number | null; valuePerClick: number | null }>()
  for (const item of keywordVolumes) {
    const keyword = normalizeIntentKeyword(item.keyword ?? "")
    if (!keyword) continue
    metrics.set(keyword, {
      monthlyVolume: Number.isFinite(item.monthlyVolume) ? Number(item.monthlyVolume) : null,
      valuePerClick: Number.isFinite(item.valuePerClick) ? Number(item.valuePerClick) : null,
    })
  }

  return metrics
}

function selectSerpRankerDomains(
  domains: HubblyIntelligenceDomainPositions[],
  targetDomain: string,
  priorityKeywords: string[],
) {
  return domains
    .filter((domain) => domain.domain !== targetDomain)
    .map((domain) => ({
      domain: domain.domain,
      shareOfVoice: calculateShareOfVoice(domain, priorityKeywords),
      bestPosition: bestMeasuredPosition(domain),
    }))
    .filter((domain) => domain.bestPosition !== null)
    .sort((a, b) => b.shareOfVoice - a.shareOfVoice || (a.bestPosition ?? 999) - (b.bestPosition ?? 999))
    .map((domain) => domain.domain)
    .slice(0, 3)
}

function calculateShareOfVoice(domainPositions: HubblyIntelligenceDomainPositions | undefined, priorityKeywords: string[]) {
  if (!domainPositions || !priorityKeywords.length) return 0
  const positionByKeyword = new Map(domainPositions.keywords.map((item) => [item.keyword, item.position]))
  const score = priorityKeywords.reduce((sum, keyword) => {
    const position = positionByKeyword.get(keyword)
    if (!position || position > 10) return sum
    return sum + ((11 - position) / 10)
  }, 0)

  return round4(score / priorityKeywords.length)
}

function buildCompetitiveDiagnosis(input: {
  targetDomain: string
  measuredDomains: Array<{ domain: string; kind: string; label: string; avgPosition: number | null }>
  positions: HubblyIntelligenceDomainPositions[]
  backlinkByDomain: Map<string, { referringDomains: number | null }>
  priorityKeywords: string[]
  targetShareOfVoice: number
}) {
  const targetPositions = input.positions.find((item) => item.domain === input.targetDomain)
  const targetBacklinks = input.backlinkByDomain.get(input.targetDomain)
  const targetReferringDomains = targetBacklinks?.referringDomains ?? null
  const competitorRows = input.measuredDomains.slice(0, 3).map((domain) => {
    const positions = input.positions.find((item) => item.domain === domain.domain)
    const backlinks = input.backlinkByDomain.get(domain.domain)
    const referringDomains = backlinks?.referringDomains ?? null

    return {
      domain: domain.domain,
      label: domain.label,
      kind: domain.kind,
      shareOfVoice: calculateShareOfVoice(positions, input.priorityKeywords),
      avgPosition: domain.avgPosition ?? averageMeasuredPosition(positions),
      rankings: measuredRankings(positions, input.priorityKeywords),
      keywordIntentMix: keywordIntentMix(positions),
      referringDomains,
      authorityDeficit: authorityDeficit(targetReferringDomains, referringDomains),
      provenance: "measured" as const,
    }
  })

  return {
    rows: [
      {
        domain: input.targetDomain,
        label: "Your domain",
        kind: "target",
        shareOfVoice: input.targetShareOfVoice,
        avgPosition: averageMeasuredPosition(targetPositions),
        rankings: measuredRankings(targetPositions, input.priorityKeywords),
        keywordIntentMix: keywordIntentMix(targetPositions),
        referringDomains: targetReferringDomains,
        authorityDeficit: 0,
        provenance: "measured" as const,
      },
      ...competitorRows,
    ],
    provenance: "measured" as const,
  }
}

function buildCompetitiveCost(
  bleeding: Array<{
    keyword: string
    monthlyVolume: number
    competitorDomains: string[]
    bestCompetitorPosition?: number | null
    targetPosition?: number | null
    valuePerClick?: number | null
  }>,
  diagnosisRows: Array<{ domain: string; kind: string; referringDomains: number | null; authorityDeficit: number | null; provenance: "measured" }>,
) {
  const formulaInputs = bleeding
    .map((item) => {
      const position = item.bestCompetitorPosition ?? null
      const ctr = ctrForPosition(position)
      const valuePerClick = item.valuePerClick ?? null
      const estimatedValue = ctr !== null && valuePerClick !== null
        ? Math.round(item.monthlyVolume * ctr * valuePerClick)
        : null
      const ctrSource = position && ctr !== null
        ? `inferred (CTR curve: ${ORGANIC_CTR_CURVE_SOURCE.name} ${ORGANIC_CTR_CURVE_SOURCE.year}, position ${Math.min(Math.round(position), 10)})`
        : "inferred (CTR curve unavailable: no measured competitor position)"

      return {
        keyword: item.keyword,
        search_volume: item.monthlyVolume,
        target_position: item.targetPosition ?? null,
        target_ctr: ctrForPosition(item.targetPosition ?? null) ?? 0,
        competitor_position: position,
        position_ctr: ctr,
        position_ctr_provenance: ctrSource,
        position_ctr_source_url: ORGANIC_CTR_CURVE_SOURCE.url,
        value_per_click: valuePerClick,
        estimated_value: estimatedValue,
        excluded_from_sum: estimatedValue === null,
        exclusion_reason: valuePerClick === null
          ? "missing measured CPC"
          : ctr === null
            ? "missing measured competitor position"
            : null,
        sources: COMPETITIVE_FORMULA_SOURCES,
      }
    })
  const monthly = formulaInputs.reduce((sum, item) => sum + (item.estimated_value ?? 0), 0)

  return {
    invisibleKeywords: bleeding,
    monthlySearchesAtRisk: bleeding.reduce((sum, item) => sum + item.monthlyVolume, 0),
    revenueAtRisk: {
      monthly,
      provenance: "inferred" as const,
      formula: {
        expression: "sum(search_volume * position_ctr * value_per_click)",
        inputs: formulaInputs,
        sources: COMPETITIVE_FORMULA_SOURCES,
        ctr_curve: ORGANIC_CTR_CURVE_SOURCE,
      },
    },
    authorityDeficit: diagnosisRows
      .filter((row) => row.kind !== "target" && typeof row.authorityDeficit === "number" && row.authorityDeficit > 0)
      .map((row) => ({
        domain: row.domain,
        referringDomains: row.referringDomains,
        deficit: row.authorityDeficit,
        provenance: "measured" as const,
      })),
    provenance: {
      invisibleKeywords: "measured",
      monthlySearchesAtRisk: "measured",
      revenueAtRisk: "inferred",
      authorityDeficit: "measured",
    },
  }
}

type GamePlanSynthesizer = (prompt: string, modelConfig: ScanModelConfig) => Promise<unknown>

async function buildConstrainedGamePlan(input: {
  companyName: string
  analysis: AuditAnalysis
  competitiveIntelligence: Record<string, unknown>
  modelConfig?: ScanModelConfig
  log?: (level: AuditDebugLog["level"], step: string, message: string, detail?: Record<string, unknown>) => void
  synthesize?: GamePlanSynthesizer
  env?: Record<string, string | undefined>
}) {
  const modelConfig = input.modelConfig ?? getScanModelConfig("free")
  const capabilities = enabledRankCapabilities(input.env)
  const gaps = measuredCompetitiveGaps(input.competitiveIntelligence)

  if (input.competitiveIntelligence.status !== "measured" || !gaps.length) {
    return analysisPendingGamePlan("measured_competitive_gaps_unavailable", capabilities, modelConfig)
  }

  const prompt = buildGamePlanPrompt({
    companyName: input.companyName,
    analysis: input.analysis,
    competitiveIntelligence: input.competitiveIntelligence,
    capabilities,
    gaps,
  })

  try {
    const rawPlan = await (input.synthesize ?? callClaudeJson)(prompt, modelConfig)
    return validateGamePlan(rawPlan, capabilities, modelConfig)
  } catch (error) {
    input.log?.("warn", "game_plan", "Rank game plan synthesis is pending", {
      error: getErrorMessage(error),
    })
    return analysisPendingGamePlan("synthesis_unavailable", capabilities, modelConfig)
  }
}

function buildGamePlanPrompt(input: {
  companyName: string
  analysis: AuditAnalysis
  competitiveIntelligence: Record<string, unknown>
  capabilities: RankCapability[]
  gaps: string[]
}) {
  const capabilityAllowlist = input.capabilities.map((capability) => ({
    id: capability.id,
    label: capability.label,
    description: capability.description,
  }))

  return `You are writing Act 3 of a public competitive scan for ${input.companyName}.

Use only the measured gaps and only the Rank capabilities in the allowlist.

Measured gaps:
${JSON.stringify(input.gaps, null, 2)}

Allowed Rank capabilities:
${JSON.stringify(capabilityAllowlist, null, 2)}

Context:
${JSON.stringify({
    product: input.analysis.product,
    industry: input.analysis.industry,
    business_model: input.analysis.business_model,
    buyer_type: input.analysis.buyer_type,
    category: input.analysis.category,
    diagnosis: input.competitiveIntelligence.diagnosis,
    cost: input.competitiveIntelligence.cost,
  }, null, 2)}

Return JSON only:
{
  "status": "recommendation",
  "moves": [
    {
      "title": "Short action name",
      "capability_id": "one allowed capability id",
      "measured_gap": "Specific measured gap from the list above",
      "why_this": "Why this capability addresses that gap",
      "plan": "Plan/projection wording. Never guarantee an outcome."
    }
  ]
}

Rules:
- capability_id must be one of the allowed Rank capability IDs exactly.
- Do not recommend content generation or autonomous publishing unless those IDs appear in the allowlist.
- Every move must trace to a measured gap above.
- Frame this as a plan/projection, never a guarantee.
- Do not promise rankings, revenue, traffic, first-page placement, or a numeric lift.`
}

function measuredCompetitiveGaps(competitive: Record<string, unknown>) {
  const gaps: string[] = []
  const diagnosis = competitive.diagnosis as { rows?: Array<Record<string, unknown>> } | undefined
  const rows = diagnosis?.rows ?? []
  const target = rows.find((row) => row.kind === "target")
  const targetShare = typeof target?.shareOfVoice === "number" ? target.shareOfVoice : null

  for (const row of rows.filter((item) => item.kind !== "target").slice(0, 3)) {
    const domain = String(row.domain ?? "competitor")
    const shareOfVoice = typeof row.shareOfVoice === "number" ? row.shareOfVoice : null
    const authorityDeficitValue = typeof row.authorityDeficit === "number" ? row.authorityDeficit : null

    if (targetShare !== null && shareOfVoice !== null && shareOfVoice > targetShare) {
      gaps.push(`${domain} has higher measured share of voice (${shareOfVoice}) than the target (${targetShare}).`)
    }
    if (authorityDeficitValue !== null && authorityDeficitValue > 0) {
      gaps.push(`${domain} has a measured authority gap of ${authorityDeficitValue} referring domains over the target.`)
    }
  }

  const bleeding = Array.isArray(competitive.bleeding) ? competitive.bleeding : []
  const invisibleKeywords = bleeding
    .slice(0, 5)
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const record = item as Record<string, unknown>
      const keyword = typeof record.keyword === "string" ? record.keyword : null
      const monthlyVolume = typeof record.monthlyVolume === "number" ? record.monthlyVolume : null
      if (!keyword || !monthlyVolume) return null
      return `${keyword} (${monthlyVolume} measured monthly searches)`
    })
    .filter((item): item is string => Boolean(item))

  if (invisibleKeywords.length) {
    gaps.push(`The target is invisible for measured competitor keywords: ${invisibleKeywords.join(", ")}.`)
  }

  return gaps.slice(0, 8)
}

function validateGamePlan(rawPlan: unknown, capabilities: RankCapability[], modelConfig: ScanModelConfig): RankGamePlan {
  if (!rawPlan || typeof rawPlan !== "object") {
    throw new AuditPipelineError("game_plan_invalid", "Game plan response was not an object", true)
  }

  const plan = rawPlan as Record<string, unknown>
  const moves = Array.isArray(plan.moves) ? plan.moves : []
  if (plan.status !== "recommendation" || !moves.length) {
    throw new AuditPipelineError("game_plan_invalid", "Game plan response is missing recommendation moves", true)
  }

  const allowedIds = new Set(capabilities.map((capability) => capability.id))
  const normalizedMoves = moves.slice(0, 4).map((move, index) => {
    if (!move || typeof move !== "object") {
      throw new AuditPipelineError("game_plan_invalid", `Game plan move ${index + 1} is invalid`, true)
    }

    const record = move as Record<string, unknown>
    const capabilityId = typeof record.capability_id === "string" ? record.capability_id : ""
    const capability = rankCapabilityById(capabilityId)
    const title = normalizeTextValue(record.title)
    const measuredGap = normalizeTextValue(record.measured_gap)
    const planText = normalizeTextValue(record.plan)
    const whyThis = normalizeTextValue(record.why_this)

    if (!allowedIds.has(capabilityId) || !capability) {
      throw new AuditPipelineError("game_plan_disallowed_capability", `Game plan used disallowed capability ${capabilityId || "(missing)"}`, true)
    }
    if (!title || !measuredGap || !planText) {
      throw new AuditPipelineError("game_plan_invalid", `Game plan move ${index + 1} is missing required fields`, true)
    }
    if (containsOutcomeGuarantee([title, measuredGap, planText, whyThis].filter(Boolean).join(" "))) {
      throw new AuditPipelineError("game_plan_guarantee", "Game plan contains guarantee language", true)
    }

    return {
      title,
      capability_id: capability.id,
      capability_label: capability.label,
      measured_gap: measuredGap,
      plan: planText,
      why_this: whyThis ?? undefined,
      provenance: "recommendation" as const,
    }
  })

  return {
    status: "recommendation",
    moves: normalizedMoves,
    allowed_capability_ids: capabilities.map((capability) => capability.id),
    capabilities: publicRankCapabilities(capabilities),
    provenance: "recommendation",
    model_provenance: toPublicModelProvenance(modelConfig),
  }
}

function analysisPendingGamePlan(reason: string, capabilities: RankCapability[], modelConfig: ScanModelConfig): RankGamePlan {
  return {
    status: "analysis_pending",
    label: "Game plan generating…",
    reason,
    moves: [],
    allowed_capability_ids: capabilities.map((capability) => capability.id),
    capabilities: publicRankCapabilities(capabilities),
    provenance: "recommendation",
    model_provenance: toPublicModelProvenance(modelConfig),
  }
}

function publicRankCapabilities(capabilities: RankCapability[]) {
  return capabilities.map((capability) => ({
    id: capability.id,
    label: capability.label,
    description: capability.description,
    tier: capability.tier,
  }))
}

function normalizeTextValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.replace(/\s+/g, " ").trim() : null
}

function containsOutcomeGuarantee(value: string) {
  const sentences = value
    .toLowerCase()
    .split(/[.!?\n;]+/)
    .map((sentence) => sentence.replace(/\s+/g, " ").trim())
    .filter(Boolean)

  return sentences.some((sentence) => {
    if (/\bwill\s+rank\b|\bwill\s+outrank\b|\byou\s+will\s+(?:outrank|beat|overtake|surpass)\b|\bwill\s+(?:overtake|surpass)\b|\boutrank\s+(?:[a-z0-9-]+\.)+[a-z]{2,}\b|\brank\s+#?1\b|\b#1\s+ranking\b|\b10x\b|\bdouble your\b|\btriple your\b|\bcertain to\b|\bassured\b/.test(sentence)) {
      return true
    }

    const hasGuarantee = /\bguarantee(?:d|s)?\b|\bpromise[sd]?\b/.test(sentence)
    if (!hasGuarantee) return false

    const negated = /\b(no|not|never|without)\b.{0,80}\b(guarantee(?:d|s)?|promise[sd]?)\b/.test(sentence)
    if (negated) return false

    return /\b(rank|ranking|traffic|revenue|lift|first[-\s]?page|#1|placement|outcome|result)\b/.test(sentence)
  })
}

function averageMeasuredPosition(domainPositions: HubblyIntelligenceDomainPositions | undefined) {
  const positions = (domainPositions?.keywords ?? [])
    .map((item) => item.position)
    .filter((position): position is number => typeof position === "number" && Number.isFinite(position))
  if (!positions.length) return null

  return round2(positions.reduce((sum, position) => sum + position, 0) / positions.length)
}

function bestMeasuredPosition(domainPositions: HubblyIntelligenceDomainPositions | undefined) {
  const positions = (domainPositions?.keywords ?? [])
    .map((item) => item.position)
    .filter((position): position is number => typeof position === "number" && Number.isFinite(position))
  if (!positions.length) return null

  return Math.min(...positions)
}

function measuredRankings(domainPositions: HubblyIntelligenceDomainPositions | undefined, priorityKeywords: string[]) {
  const positionByKeyword = new Map((domainPositions?.keywords ?? []).map((item) => [item.keyword, item.position]))
  return priorityKeywords.map((keyword) => ({
    keyword,
    position: positionByKeyword.get(keyword) ?? null,
    provenance: "measured" as const,
  }))
}

function keywordIntentMix(domainPositions: HubblyIntelligenceDomainPositions | undefined) {
  const mix = { commercial: 0, comparison: 0, local: 0, informational: 0 }
  for (const item of domainPositions?.keywords ?? []) {
    if (/\b(best|vs|alternative|review|compare)\b/.test(item.keyword)) {
      mix.comparison += 1
    } else if (/\b(near me|local|restaurant|service)\b/.test(item.keyword)) {
      mix.local += 1
    } else if (/\b(price|pricing|cost|fee|software|platform|api|services?)\b/.test(item.keyword)) {
      mix.commercial += 1
    } else {
      mix.informational += 1
    }
  }

  return { ...mix, provenance: "measured" as const }
}

function authorityDeficit(targetReferringDomains: number | null, competitorReferringDomains: number | null) {
  if (targetReferringDomains === null || competitorReferringDomains === null) return null

  return Math.max(competitorReferringDomains - targetReferringDomains, 0)
}

function isMarketplaceDomain(domain: string) {
  return /(^|\.)?(yelp|tripadvisor|g2|capterra|softwareadvice|trustpilot|reddit|youtube|facebook|linkedin|instagram|amazon)\./i.test(domain)
}

function ctrForPosition(position?: number | null) {
  if (!position || position < 1) return null

  return ORGANIC_CTR_CURVE[Math.min(Math.round(position), 10)] ?? null
}

function buildBleedingKeywords(
  domains: HubblyIntelligenceDomainPositions[],
  targetDomain: string,
  priorityKeywords: string[],
  keywordMetrics: Map<string, { monthlyVolume: number | null; valuePerClick: number | null }>,
) {
  const targetPositions = new Map((domains.find((item) => item.domain === targetDomain)?.keywords ?? [])
    .map((item) => [item.keyword, item.position ?? null]))
  const bleeding = new Map<string, {
    keyword: string
    monthlyVolume: number
    competitorDomains: string[]
    bestCompetitorPosition: number | null
    targetPosition: number | null
    valuePerClick: number | null
    provenance: "measured"
  }>()

  for (const domain of domains) {
    if (domain.domain === targetDomain) continue
    for (const item of domain.keywords) {
      if (!priorityKeywords.includes(item.keyword) || !item.position) continue
      const targetPosition = targetPositions.get(item.keyword) ?? null
      if (targetPosition && targetPosition <= item.position) continue
      const metrics = keywordMetrics.get(item.keyword)
      const monthlyVolume = metrics?.monthlyVolume ?? item.monthlyVolume
      if (!monthlyVolume) continue
      const existing = bleeding.get(item.keyword)
      if (existing) {
        existing.competitorDomains.push(domain.domain)
        if (item.position && (!existing.bestCompetitorPosition || item.position < existing.bestCompetitorPosition)) {
          existing.bestCompetitorPosition = item.position
        }
        if (existing.valuePerClick === null && metrics?.valuePerClick !== null && metrics?.valuePerClick !== undefined) {
          existing.valuePerClick = metrics.valuePerClick
        }
      } else {
        bleeding.set(item.keyword, {
          keyword: item.keyword,
          monthlyVolume,
          competitorDomains: [domain.domain],
          bestCompetitorPosition: item.position ?? null,
          targetPosition,
          valuePerClick: metrics?.valuePerClick ?? item.valuePerClick ?? null,
          provenance: "measured",
        })
      }
    }
  }

  return Array.from(bleeding.values()).sort((a, b) => b.monthlyVolume - a.monthlyVolume)
}

function matchNarrative(domain: string, competitors: Array<Record<string, unknown>>) {
  return competitors.find((item) => typeof item.name === "string" && narrativeMatchesDomain(domain, item.name)) ?? null
}

function narrativeMatchesDomain(domain: string, name: string) {
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]+/g, "")
  const normalizedDomain = domain.split(".")[0].replace(/[^a-z0-9]+/g, "")
  return Boolean(normalizedName && normalizedDomain && (normalizedName.includes(normalizedDomain) || normalizedDomain.includes(normalizedName)))
}

function round4(value: number) {
  return Math.round(value * 10000) / 10000
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

function normalizeIntentKeyword(value: string) {
  return decodeHtml(stripTags(value))
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9\s/.'"-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function calculateHighIntentVolume(keywords: Array<{ keyword: string; monthlyVolume: number; competition?: string | null }>) {
  return keywords
    .filter((item) => isHighIntentKeyword(item.keyword) || isHighCompetitionKeyword(item.competition))
    .reduce((sum, item) => sum + item.monthlyVolume, 0)
}

function isHighIntentKeyword(keyword: string) {
  return /\b(pricing|price|cost|demo|contact sales|buy|order|book|schedule|reservation|reserve|near me|menu|alternative|vs|compare|reviews?)\b/i.test(keyword)
}

function isHighCompetitionKeyword(value?: string | null) {
  if (!value) return false
  return value.toLowerCase() === "high" || Number(value) >= 60
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
    category: normalizeCategory(input.category) ?? normalizeCategory(input.raw_category),
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

  if (field === "categories") {
    return fuzzyCanonicalizeCategory(normalized)
  }

  return null
}

function normalizeVocabValue(value?: string | null) {
  return normalizeText(value)?.toLowerCase().replace(/[_-]+/g, " ").replace(/[^a-z0-9\s]+/g, " ").replace(/\s+/g, " ").trim() ?? null
}

const GENERIC_CATEGORY_TOKENS = new Set([
  "ai",
  "and",
  "automation",
  "b2b",
  "b2c",
  "business",
  "company",
  "consumer",
  "digital",
  "for",
  "general",
  "local",
  "online",
  "operations",
  "platform",
  "product",
  "service",
  "services",
  "software",
  "solution",
  "solutions",
  "system",
  "technology",
  "tool",
  "tools",
])

const WEAK_SYNTHESIS_CATEGORIES = new Set([
  "default",
  "general",
  "general service",
  "general services",
  "local service",
  "local services",
  "misc",
  "miscellaneous",
  "other",
  "service",
  "services",
  "unknown",
  "uncategorized",
])

function fuzzyCanonicalizeCategory(normalized: string) {
  const valueTokens = meaningfulCategoryTokens(normalized)
  if (valueTokens.length < 2) return null

  const scores = siteProfileVocab.categories
    .map((entry) => {
      const labels = [entry.slug, entry.display, ...entry.aliases].filter(Boolean)
      const best = labels.reduce((bestScore, label) => {
        const labelTokens = meaningfulCategoryTokens(normalizeVocabValue(label) ?? "")
        if (labelTokens.length < 2) return bestScore
        const overlap = labelTokens.filter((token) => valueTokens.includes(token))
        if (overlap.length < 2) return bestScore
        const precision = overlap.length / valueTokens.length
        const coverage = overlap.length / labelTokens.length
        const score = (precision + coverage) / 2
        return Math.max(bestScore, score)
      }, 0)

      return { slug: entry.slug, score: best }
    })
    .sort((a, b) => b.score - a.score)

  const [best, runnerUp] = scores
  if (!best || best.score < 0.66) return null
  if (runnerUp && best.score - runnerUp.score < 0.15) return null

  return best.slug
}

function meaningfulCategoryTokens(value: string) {
  return value
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !GENERIC_CATEGORY_TOKENS.has(token))
}

function hasConfidentSynthesisCategory(value: string | null) {
  const normalized = normalizeVocabValue(value)
  if (!normalized) return false
  if (WEAK_SYNTHESIS_CATEGORIES.has(normalized)) return false
  return meaningfulCategoryTokens(normalized).length > 0
}

function detectCategoryFromSignals(value: string, industry?: string | null) {
  const combined = `${industry ?? ""} ${value}`.toLowerCase()
  const categoryScores = [
    {
      category: "gold_ira",
      score: scoreSignalMatches(combined, [
        { pattern: /\bprecious metals?\b/g, weight: 4 },
        { pattern: /\bgold ira\b/g, weight: 5 },
        { pattern: /\bsilver ira\b/g, weight: 5 },
        { pattern: /\bself[-\s]?directed ira\b/g, weight: 5 },
        { pattern: /\bira(?:s)?\b/g, weight: 3 },
        { pattern: /\bgold\b/g, weight: 3 },
        { pattern: /\bsilver\b/g, weight: 2 },
        { pattern: /\bbullion\b/g, weight: 3 },
        { pattern: /\binvest(?:or|ing|ment|ments)?\b/g, weight: 1 },
      ]),
    },
    {
      category: "payments",
      score: scoreSignalMatches(combined, [
        { pattern: /\bfinancial infrastructure\b/g, weight: 4 },
        { pattern: /\bpayment(?:s)?\b/g, weight: 3 },
        { pattern: /\bcheckout\b/g, weight: 2 },
        { pattern: /\bmerchant\b/g, weight: 2 },
        { pattern: /\bbilling\b/g, weight: 2 },
        { pattern: /\bpayout(?:s)?\b/g, weight: 2 },
      ]),
    },
    {
      category: "seafood_restaurant",
      score: scoreSignalMatches(combined, [
        { pattern: /\bseafood\b/g, weight: 4 },
        { pattern: /\bcrab\b/g, weight: 4 },
        { pattern: /\bcrab shack\b/g, weight: 6 },
        { pattern: /\bmenu\b/g, weight: 2 },
        { pattern: /\breservation(?:s)?\b/g, weight: 2 },
        { pattern: /\bdining\b/g, weight: 2 },
        { pattern: /\brestaurant(?:s)?\b/g, weight: 1 },
      ]),
    },
    {
      category: "finance",
      score: scoreSignalMatches(combined, [
        { pattern: /\bfinance\b/g, weight: 3 },
        { pattern: /\bfinancial\b/g, weight: 2 },
        { pattern: /\bwealth\b/g, weight: 3 },
        { pattern: /\bbank(?:ing)?\b/g, weight: 3 },
        { pattern: /\binvest(?:or|ing|ment|ments)?\b/g, weight: 2 },
      ]),
    },
    {
      category: "home_services",
      score: scoreSignalMatches(combined, [
        { pattern: /\bhome services?\b/g, weight: 5 },
        { pattern: /\broof(?:ing)?\b/g, weight: 3 },
        { pattern: /\bplumb(?:ing|er)?\b/g, weight: 3 },
        { pattern: /\bhvac\b/g, weight: 3 },
        { pattern: /\bcontractor(?:s)?\b/g, weight: 3 },
      ]),
    },
  ].sort((a, b) => b.score - a.score)

  if (categoryScores[0]?.score >= 3) return categoryScores[0].category

  if (/insurance/.test(combined)) return "insurance"
  if (/mortgage|lending|loan/.test(combined)) return "mortgage"
  if (/real estate|housing|property/.test(combined)) return "real_estate"
  if (/recruit|talent|staffing|hiring/.test(combined)) return "recruiting"
  if (/solar/.test(combined)) return "solar"
  if (/\bhome services?\b|\broof(?:ing)?\b|\bplumb(?:ing|er)?\b|\bhvac\b|\bcontractor(?:s)?\b/.test(combined)) return "home_services"
  if (/commerce|retail|shop|consumer brand/.test(combined)) return "ecommerce"
  if (/agency|marketing/.test(combined)) return "marketing_agency"
  if (/health|medical|clinic/.test(combined)) return "healthcare"
  if (/finance|wealth|bank|ira|investment/.test(combined)) return "finance"
  if (/saas|software|platform|devtool|analytics|crm|api/.test(combined)) return "saas"

  return null
}

function scoreSignalMatches(value: string, signals: Array<{ pattern: RegExp; weight: number }>) {
  return signals.reduce((score, signal) => {
    const matches = value.match(signal.pattern)
    return score + (matches?.length ?? 0) * signal.weight
  }, 0)
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

function humanizeCategory(category: string) {
  return category.replace(/_/g, " ")
}

function buildGeographies(siteProfile: SiteProfile) {
  if (!siteProfile.buyer_type || !siteProfile.business_model || !(siteProfile.category ?? siteProfile.raw_category)) {
    return []
  }

  return []
}

export const buildSiteProfileForTest = buildSiteProfile
export const estimateIntentDataForTest = buildMeasuredIntentData
export const buildMeasuredIntentDataForTest = buildMeasuredIntentData
export const buildCompetitiveIntelligenceForTest = buildCompetitiveIntelligence
export const buildConstrainedGamePlanForTest = buildConstrainedGamePlan
export const buildGamePlanPromptForTest = buildGamePlanPrompt
export const containsOutcomeGuaranteeForTest = containsOutcomeGuarantee
export { normalizeIntentKeyword }
export const extractObservedEvidenceForTest = extractObservedEvidence
export const mergeObservedEvidenceForTest = mergeObservedEvidence
export const siteProfileVocabVersionForTest = siteProfileVocab.version
export const normalizeSiteProfileValuesForTest = normalizeSiteProfileValues
export const scanModelPolicyForTest = SCAN_MODEL_POLICY
