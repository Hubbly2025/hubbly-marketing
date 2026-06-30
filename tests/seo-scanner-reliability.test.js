const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")
const vm = require("node:vm")

function loadTsModule(relativePath, options = {}) {
  const absolutePath = path.join(process.cwd(), relativePath)
  const source = options.transform
    ? options.transform(fs.readFileSync(absolutePath, "utf8"), relativePath)
    : fs.readFileSync(absolutePath, "utf8")
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      resolveJsonModule: true,
    },
  }).outputText
  const module = { exports: {} }
  const sandbox = {
    exports: module.exports,
    module,
    require: (specifier) => {
      if (specifier === "__signalPipeline") return options.signalPipeline
      if (specifier.startsWith("@/")) {
        return loadTsModule(specifier.replace("@/", ""), options)
      }
      if (specifier.startsWith("./")) {
        const base = path.join(path.dirname(relativePath), specifier)
        const tsPath = `${base}.ts`
        const jsonPath = `${base}.json`
        if (fs.existsSync(path.join(process.cwd(), tsPath))) return loadTsModule(tsPath, options)
        if (fs.existsSync(path.join(process.cwd(), jsonPath))) return require(path.join(process.cwd(), jsonPath))
      }
      return require(specifier)
    },
    process,
    console,
    URL,
    Response,
    fetch: (...args) => global.fetch(...args),
    AbortSignal,
    setTimeout,
    clearTimeout,
    crypto: { randomUUID: () => "test-signal-id" },
  }
  vm.runInNewContext(compiled, sandbox, { filename: absolutePath })
  return module.exports
}

function loadProcessAudit(signalPipeline) {
  return loadTsModule("lib/audit/process-audit.ts", {
    signalPipeline,
    transform(source, relativePath) {
      if (relativePath !== "lib/audit/process-audit.ts") return source
      return source.replace(
        'import { runSignalAudit } from "@/lib/seo-report/pipeline"',
        'const { runSignalAudit } = require("__signalPipeline")',
      )
    },
  })
}

function domainOverview(count, etv) {
  return {
    tasks: [
      {
        result: [
          {
            items: [
              {
                metrics: {
                  organic: { count, etv },
                },
              },
            ],
          },
        ],
      },
    ],
  }
}

function classification(business_model = "local_service") {
  return {
    buyer_type: "consumer",
    business_model,
    confidence: "high",
    rationale: "Local plumbing and HVAC service business.",
  }
}

async function testRelevanceBrandAndPageTextFallbacks() {
  const {
    buildBusinessContext,
    classifyKeywordRelevance,
    filterRelevantKeywords,
  } = loadTsModule("lib/seo-report/relevance.ts")

  const context = buildBusinessContext(
    "mikediamondservices.com",
    classification("local_service"),
    "Mike Diamond is The Smell Good Plumber. We repair plumbing, drains, water heaters, sinks, HVAC and electrical systems.",
    "Mike Diamond",
  )

  const brandResult = classifyKeywordRelevance("mike diamond plumbing", context)
  assert.equal(brandResult.decision, "on_domain")
  assert.equal(brandResult.reason, "brand_token_match")
  const pageTextResult = classifyKeywordRelevance("smell good plumber", context)
  assert.equal(pageTextResult.decision, "on_domain")
  assert.equal(pageTextResult.reason, "page_text_token_match")
  assert.equal(classifyKeywordRelevance("doordash 1099", context).decision, "off_domain")
  assert.equal(classifyKeywordRelevance("routing number", context).decision, "off_domain")

  const kept = filterRelevantKeywords(
    [
      { keyword: "mike diamond plumbing", volume: 900 },
      { keyword: "smell good plumber", volume: 300 },
      { keyword: "doordash 1099", volume: 12000 },
    ],
    context,
  )
  assert.equal(JSON.stringify(kept.map((row) => row.keyword)), JSON.stringify(["mike diamond plumbing", "smell good plumber"]))
}

function testAuthorityGuardrailAndDisplayedKeywordFallback() {
  const { buildSeoReport } = loadTsModule("lib/seo-report/synthesis.ts")

  const report = buildSeoReport({
    domain: "stripe.com",
    classification: {
      buyer_type: "business",
      business_model: "b2b_saas",
      confidence: "high",
      rationale: "Payments platform and financial infrastructure.",
    },
    pageText: "Stripe builds payment infrastructure, online payments, checkout, billing, fraud prevention, and API tools for internet businesses.",
    domainRankOverview: domainOverview(145808, 3647946),
    externalApiStatus: "measured",
    keywords: [
      { keyword: "routing number", volume: 300000, currentRank: 1, intent: "informational", provenance: "measured", source: "test", label: "Measured" },
      { keyword: "doordash 1099", volume: 200000, currentRank: 2, intent: "informational", provenance: "measured", source: "test", label: "Measured" },
      { keyword: "stripe payments", volume: 9000, currentRank: 3, intent: "commercial", provenance: "measured", source: "test", label: "Measured" },
      { keyword: "payment api", volume: 8000, currentRank: 4, intent: "commercial", provenance: "measured", source: "test", label: "Measured" },
      { keyword: "online checkout", volume: 7000, currentRank: 5, intent: "commercial", provenance: "measured", source: "test", label: "Measured" },
    ],
    competitors: [],
    backlinks: null,
    gapKeywords: [],
    generatedAt: "2026-06-29T12:00:00.000Z",
  })

  assert.notEqual(report.gapState, "greenfield")
  assert.match(report.scorecard.verdict, /organic presence|Strong rankings|rank/i)
  const displayed = report.keywordAnalysis.clusters.flatMap((cluster) => cluster.keywords.map((keyword) => keyword.keyword))
  assert(displayed.length >= 3)
  assert(displayed.includes("stripe payments"))
  assert(displayed.includes("payment api"))
  assert(displayed.includes("online checkout"))
  assert(!displayed.includes("routing number"))
  assert(!displayed.includes("doordash 1099"))

  const thin = buildSeoReport({
    domain: "newlocal.example",
    classification: classification("local_service"),
    pageText: "New local service site.",
    domainRankOverview: domainOverview(12, 100),
    externalApiStatus: "measured",
    keywords: [],
    competitors: [],
    backlinks: null,
    gapKeywords: [],
    generatedAt: "2026-06-29T12:00:00.000Z",
  })
  assert.equal(thin.gapState, "greenfield")
}

async function testEmptyMarketingScrapeContinuesWhenSignalSucceeds() {
  const updates = []
  const originalFetch = global.fetch
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key"
  delete process.env.SCRAPINGBEE_API_KEY
  delete process.env.Scrapingbee
  delete process.env.ANTHROPIC_API_KEY

  global.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input.url
    if (url.includes("/rest/v1/audit_leads")) {
      updates.push(JSON.parse(init.body))
      return new Response("[]", { status: 200 })
    }
    return new Response("blocked", { status: 403 })
  }

  try {
    const { processAudit } = loadProcessAudit({
      async runSignalAudit() {
        return {
          id: "signal-ok",
          cached: false,
          audit: {
            status: "ready",
            scrape: { pagesRead: [{ url: "https://lakewaypoolservice.net", status: 200, title: "Lakeway Pool", textSample: "Pool service" }], notDetected: [] },
            seoReport: {
              title: "SEO report",
              domain: "lakewaypoolservice.net",
              generatedAt: "2026-06-29T12:00:00.000Z",
              scanDate: "2026-06-29",
              dataforseoReturned: false,
              externalApiStatus: "unavailable",
              measuredVia: "Measured by Hubbly",
              scorecard: {},
              strengths: [],
              weaknesses: [],
              keywordAnalysis: { clusters: [], semanticNote: "" },
              competitors: null,
              backlinks: null,
              gapKeywords: [],
              gapVolumeTotal: 0,
              competitorGap: [],
              gapState: "greenfield",
              plan: { intro: "", months: [], totalOutput: "" },
              closer: { headline: "", body: "", semiAutopilot: "", fullAutopilot: "", cta: "" },
            },
          },
        }
      },
    })

    await processAudit("audit-empty-marketing", "https://lakewaypoolservice.net")
  } finally {
    global.fetch = originalFetch
  }

  const finalUpdate = updates.at(-1)
  assert.equal(finalUpdate.status, "complete")
  assert.equal(finalUpdate.analysis.seo_report.domain, "lakewaypoolservice.net")
  assert.match(finalUpdate.error_message, /GTM analysis limited/i)
}

async function testEmptyMarketingScrapeFailsWhenSignalAlsoEmpty() {
  const updates = []
  const originalFetch = global.fetch
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key"
  delete process.env.SCRAPINGBEE_API_KEY
  delete process.env.Scrapingbee
  delete process.env.ANTHROPIC_API_KEY

  global.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input.url
    if (url.includes("/rest/v1/audit_leads")) {
      updates.push(JSON.parse(init.body))
      return new Response("[]", { status: 200 })
    }
    return new Response("blocked", { status: 403 })
  }

  try {
    const { processAudit } = loadProcessAudit({
      async runSignalAudit() {
        return {
          id: "signal-empty",
          cached: false,
          audit: {
            status: "not_enough_signal",
            scrape: { pagesRead: [], notDetected: ["Not enough signal"] },
            seoReport: {
              externalApiStatus: "empty",
              keywordAnalysis: { clusters: [], semanticNote: "" },
              gapKeywords: [],
            },
          },
        }
      },
    })

    await processAudit("audit-both-empty", "https://dead-example.invalid")
  } finally {
    global.fetch = originalFetch
  }

  const finalUpdate = updates.at(-1)
  assert.equal(finalUpdate.status, "failed")
  assert.match(finalUpdate.error_message, /could not read enough/i)
}

async function main() {
  await testRelevanceBrandAndPageTextFallbacks()
  testAuthorityGuardrailAndDisplayedKeywordFallback()
  await testEmptyMarketingScrapeContinuesWhenSignalSucceeds()
  await testEmptyMarketingScrapeFailsWhenSignalAlsoEmpty()
  console.log("seo scanner reliability: 4 passed")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
