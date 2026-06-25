const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")
const vm = require("node:vm")

const sourcePath = path.join(__dirname, "..", "..", "lib", "audit", "process-audit.ts")
const source = fs.readFileSync(sourcePath, "utf8")
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    esModuleInterop: true,
    resolveJsonModule: true,
  },
}).outputText

const sandbox = {
  exports: {},
  module: { exports: {} },
  require: (specifier) => {
    if (specifier === "./site-profile-vocab.v1.json") {
      return require(path.join(__dirname, "..", "..", "lib", "audit", "site-profile-vocab.v1.json"))
    }
    if (specifier === "./hubbly-intelligence") {
      return {
        createHubblyIntelligenceClient: () => ({
          async fetchKeywordDemand() {
            return { keywords: [] }
          },
        }),
      }
    }
    if (specifier === "./hubbly-intelligence-config") {
      return { getHubblyIntelligenceConfig: () => ({ cadence: { free: "on_demand", autopilot: "weekly", workforce: "daily" } }) }
    }
    if (specifier === "./scan-guards") {
      return { normalizeAuditDomain: (value) => new URL(value).hostname.replace(/^www\./, "") }
    }
    if (specifier === "./scan-model-config") {
      return {
        getScanModelConfig: () => ({
          provider: "anthropic",
          model: "claude-opus-4-8",
          version: "4.8",
          tier: "free",
          flippable_to: "claude-sonnet-4-6",
        }),
        SCAN_MODEL_POLICY: {
          free: {
            provider: "anthropic",
            model: "claude-opus-4-8",
            version: "4.8",
            tier: "free",
            flippable_to: "claude-sonnet-4-6",
          },
          paid: {
            provider: "anthropic",
            model: "claude-opus-4-8",
            version: "4.8",
            tier: "paid",
          },
        },
        toPublicModelProvenance: (config) => ({
          model: config.model,
          version: config.version,
          tier: config.tier,
          flippable_to: config.flippable_to,
        }),
      }
    }
    if (specifier === "./rank-capabilities") {
      const capabilities = [
        { id: "rank.on_page_optimization", label: "On-page optimization", description: "Native on-page engine.", tier: "tier_1" },
        { id: "rank.structured_data_schema", label: "Structured data schema", description: "JSON-LD schema graph.", tier: "tier_1" },
        { id: "rank.aeo_llms_txt", label: "AEO llms.txt", description: "llms.txt and AI-crawler policy.", tier: "tier_1" },
        { id: "rank.instant_indexing", label: "Instant indexing", description: "IndexNow submission.", tier: "tier_1" },
      ]
      return {
        enabledRankCapabilities: () => capabilities,
        rankCapabilityById: (id) => capabilities.find((capability) => capability.id === id) ?? null,
      }
    }
    return require(specifier)
  },
  process,
  console,
  URL,
  fetch: () => {
    throw new Error("fetch should not run in evidence tests")
  },
  Headers,
  AbortSignal,
  setTimeout,
  clearTimeout,
}
sandbox.exports = sandbox.module.exports
vm.runInNewContext(compiled, sandbox, { filename: sourcePath })

const {
  extractObservedEvidenceForTest,
  mergeObservedEvidenceForTest,
  buildSiteProfileForTest,
} = sandbox.module.exports

const html = `
  <!doctype html>
  <html>
    <head>
      <meta name="generator" content="Next.js">
      <script src="/_next/static/chunks/main.js"></script>
      <script src="https://www.googletagmanager.com/gtag/js?id=G-123"></script>
    </head>
    <body>
      <nav><a href="/login">Log in</a></nav>
      <main>
        <h1>Financial infrastructure to grow your revenue</h1>
        <h2>Payments</h2>
        <h2>Billing</h2>
        <a href="/contact-sales">Contact sales</a>
        <button>Start now</button>
      </main>
    </body>
  </html>
`

const evidence = extractObservedEvidenceForTest(html, new Headers({ server: "Vercel" }))

assert.equal(evidence.primary_cta_text, "Contact sales")
assert.equal(evidence.h1, "Financial infrastructure to grow your revenue")
assert.equal(JSON.stringify(evidence.key_headers), JSON.stringify([
  "Financial infrastructure to grow your revenue",
  "Payments",
  "Billing",
]))
assert.equal(JSON.stringify(evidence.detected_tech_stack), JSON.stringify([
  "Next.js",
  "Google Tag Manager",
  "Google Analytics",
  "Vercel",
]))

const emptyEvidence = extractObservedEvidenceForTest("<html><body><p>No headings</p></body></html>", new Headers())

assert.equal(emptyEvidence.primary_cta_text, null)
assert.equal(emptyEvidence.h1, null)
assert.equal(JSON.stringify(emptyEvidence.key_headers), "[]")
assert.equal(JSON.stringify(emptyEvidence.detected_tech_stack), "[]")

const merged = mergeObservedEvidenceForTest([
  emptyEvidence,
  evidence,
  extractObservedEvidenceForTest("<h1>Fallback H1</h1><a>Book a demo</a>", new Headers()),
])

assert.equal(merged.primary_cta_text, "Contact sales")
assert.equal(merged.h1, "Financial infrastructure to grow your revenue")
assert.equal(JSON.stringify(merged.detected_tech_stack), JSON.stringify([
  "Next.js",
  "Google Tag Manager",
  "Google Analytics",
  "Vercel",
]))

const profile = buildSiteProfileForTest({
  domain: "stripe.example",
  scannedAt: "2026-06-21T12:00:00.000Z",
  analysis: {
    product: "Payments infrastructure.",
    industry: "Payments infrastructure",
    icp: { primary: { title: "Head of payments" } },
  },
  scrapedContent: "Payments infrastructure for businesses.",
  observedEvidence: merged,
})

assert.equal(JSON.stringify(profile.observed_evidence), JSON.stringify(merged))
assert.equal(profile.provenance.observed_evidence, "measured")

const rendered = JSON.stringify(profile)
assert(!rendered.includes("Captured from website CTA language during audit"))
assert(!rendered.includes("Public website signals reviewed during audit"))

console.log("observed evidence: 1 passed")
