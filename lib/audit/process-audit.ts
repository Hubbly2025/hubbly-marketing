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

export async function processAudit(auditId: string, url: string) {
  const supabase = getSupabaseConfig()

  try {
    const scrapedPages = await scrapeWebsiteDeep(url)
    const companyName = extractCompanyName(scrapedPages, url)
    const scrapedContent = formatScrapedContent(scrapedPages, companyName)

    if (scrapedContent.trim().length < 300) {
      await updateAuditLead(supabase, auditId, {
        status: "failed",
        error_message: "Not enough content found on this site. It may block automated analysis or require JavaScript to load.",
        analysis: {
          error: "Not enough content found on this site. It may block automated analysis or require JavaScript to load.",
        },
        completed_at: new Date().toISOString(),
      })
      return
    }

    const analysis = await analyzeWithClaude(scrapedContent)
    const normalizedAnalysis = {
      ...analysis,
      company_name: analysis.company_name || companyName,
    }
    const intentData = estimateIntentData(normalizedAnalysis.industry)
    const gtmPlan = buildGtmPlan(normalizedAnalysis, intentData, companyName)

    await updateAuditLead(supabase, auditId, {
      status: "complete",
      analysis: normalizedAnalysis,
      competitors: normalizedAnalysis.competitors ?? [],
      intent_data: intentData,
      gtm_plan: gtmPlan,
      sample_email: normalizedAnalysis.sample_email ?? null,
      completed_at: new Date().toISOString(),
    })
  } catch (error) {
    await updateAuditLead(supabase, auditId, {
      status: "failed",
      error_message: error instanceof Error ? error.message : "Audit processing failed",
      analysis: {
        error: error instanceof Error ? error.message : "Audit processing failed",
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

async function scrapeWebsiteDeep(url: string) {
  const base = new URL(url)
  const scrapingBeeApiKey = process.env.SCRAPINGBEE_API_KEY || process.env.Scrapingbee
  const scrapeResults = await Promise.allSettled(SCRAPE_PATHS.map(async (target) => {
    const targetUrl = new URL(target.path, base).toString()
    return scrapePage(targetUrl, target.label, scrapingBeeApiKey)
  }))
  const pages = scrapeResults
    .filter((result): result is PromiseFulfilledResult<ScrapedPage | null> => result.status === "fulfilled")
    .map((result) => result.value)
    .filter((page): page is ScrapedPage => Boolean(page))

  if (!pages.length) {
    throw new Error("No website pages could be scraped")
  }

  return pages
}

async function scrapePage(url: string, label: string, apiKey?: string) {
  try {
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
      return null
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
  } catch {
    return null
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

async function analyzeWithClaude(scrapedContent: string) {
  const firstPrompt = buildAnalysisPrompt(scrapedContent)

  try {
    return validateAnalysis(await callClaude(firstPrompt))
  } catch {
    const retryPrompt = `${firstPrompt}

Your previous response was not usable. Return only compact valid JSON with every required top-level key present: product, industry, icp, competitors, gtm_gaps, outreach_angle, sample_email.`
    return validateAnalysis(await callClaude(retryPrompt))
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
    throw new Error("ANTHROPIC_API_KEY is not configured")
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
    throw new Error(`Claude analysis failed: ${response.status} ${await response.text()}`)
  }

  const data = await response.json()
  const text = data.content
    ?.filter((item: { type: string }) => item.type === "text")
    .map((item: { text: string }) => item.text)
    .join("\n")

  if (!text) {
    throw new Error("Claude returned an empty analysis")
  }

  return parseJson(text)
}

function parseJson(text: string) {
  const cleaned = text.replace(/```json|```/g, "").trim()
  return JSON.parse(cleaned) as AuditAnalysis
}

function validateAnalysis(analysis: AuditAnalysis) {
  if (!analysis.product || !analysis.industry || !analysis.icp || !analysis.sample_email) {
    throw new Error("Claude response is missing required analysis fields")
  }

  if (!Array.isArray(analysis.competitors) || analysis.competitors.length < 1) {
    throw new Error("Claude response is missing competitor analysis")
  }

  if (!Array.isArray(analysis.gtm_gaps) || analysis.gtm_gaps.length < 1) {
    throw new Error("Claude response is missing GTM gaps")
  }

  return analysis
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
