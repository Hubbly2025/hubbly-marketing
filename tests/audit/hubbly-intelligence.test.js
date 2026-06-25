const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")
const vm = require("node:vm")

function loadTsModule(relativePath) {
  const sourcePath = path.join(__dirname, "..", "..", relativePath)
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
        return loadTsModule("lib/audit/hubbly-intelligence.ts")
      }
      if (specifier === "./hubbly-intelligence-config") {
        return loadTsModule("lib/audit/hubbly-intelligence-config.ts")
      }
      if (specifier === "./scan-guards") {
        return { normalizeAuditDomain: (value) => new URL(value).hostname.replace(/^www\./, "") }
      }
      if (specifier === "./scan-model-config") {
        return loadTsModule("lib/audit/scan-model-config.ts")
      }
      if (specifier === "./rank-capabilities") {
        return loadTsModule("lib/audit/rank-capabilities.ts")
      }
      return require(specifier)
    },
    process,
    console,
    URL,
    fetch: () => {
      throw new Error("fetch should not run in mocked intelligence tests")
    },
    Headers,
    AbortSignal,
    setTimeout,
    clearTimeout,
  }
  sandbox.exports = sandbox.module.exports
  vm.runInNewContext(compiled, sandbox, { filename: sourcePath })
  return sandbox.module.exports
}

const {
  normalizeIntentKeyword,
  buildMeasuredIntentDataForTest,
  buildCompetitiveIntelligenceForTest,
  buildSiteProfileForTest,
} = loadTsModule("lib/audit/process-audit.ts")

const stripeProfile = buildSiteProfileForTest({
  domain: "stripe.example",
  scannedAt: "2026-06-21T12:00:00.000Z",
  analysis: {
    product: "Payments infrastructure.",
    industry: "Payments infrastructure",
    icp: { primary: { title: "Head of payments" } },
  },
  scrapedContent: "Stripe offers payments APIs for businesses.",
})

const measuredClient = {
  async fetchKeywordDemand(request) {
    assert.equal(request.category, "payments")
    assert.equal(request.buyerType, "business")
    assert.equal(request.businessModel, "b2b_saas")
    return {
      keywords: [
        { keyword: "payments API pricing", monthlyVolume: 1200 },
        { keyword: " best payment processing software ", monthlyVolume: 800 },
        { keyword: "merchant services", monthlyVolume: 300, competition: "HIGH" },
        { keyword: "1/2 oz payment coin", monthlyVolume: 0 },
      ],
    }
  },
}

let measuredIntent
let insufficientIntent

buildMeasuredIntentDataForTest(stripeProfile, measuredClient).then((intent) => {
  measuredIntent = intent
  assert.equal(intent.status, "measured")
  assert.equal(intent.monthly, 2300)
  assert.equal(intent.weekly, undefined)
  assert.equal(intent.highIntent, 1500)
  assert.notEqual(intent.highIntent, intent.monthly)
  assert.equal(JSON.stringify(intent.top_signals), JSON.stringify([
    "payments api pricing",
    "best payment processing software",
    "merchant services",
  ]))
  assert.equal(intent.provenance.monthly, "measured")
  assert.equal(intent.provenance.top_signals, "measured")

  return buildMeasuredIntentDataForTest(stripeProfile, {
    async fetchKeywordDemand() {
      return { keywords: [] }
    },
  })
}).then((emptyIntent) => {
  insufficientIntent = emptyIntent
  assert.equal(emptyIntent.status, "insufficient_signal")
  assert.equal(emptyIntent.monthly, 0)
  assert.equal(JSON.stringify(emptyIntent.top_signals), "[]")

  return buildMeasuredIntentDataForTest(stripeProfile, {
    async fetchKeywordDemand() {
      throw new DOMException("The operation was aborted due to timeout", "TimeoutError")
    },
  })
}).then((vendorErrorIntent) => {
  assert.equal(vendorErrorIntent.status, "data_unavailable")
  assert.equal(vendorErrorIntent.provenance.monthly, "data_unavailable")
  assert.equal(vendorErrorIntent.error.type, "vendor_timeout")
  assert.match(vendorErrorIntent.label, /temporarily unavailable/i)

  assert.equal(normalizeIntentKeyword("1 oz gold ira"), "1 oz gold ira")
  assert.equal(normalizeIntentKeyword("1/2 oz gold ira"), "1/2 oz gold ira")
  assert.equal(normalizeIntentKeyword("software for ops"), "software for ops")
  assert(!normalizeIntentKeyword("1 oz").includes("0z"))

  return buildCompetitiveIntelligenceForTest(
    stripeProfile,
    [
      {
        name: "Adyen",
        their_angle: "Global payments platform.",
        their_weakness: "Enterprise-heavy onboarding.",
        your_opening: "Developer-first integration.",
      },
      {
        name: "Checkout.com",
        their_angle: "Enterprise payment processing.",
      },
    ],
    measuredIntent,
    {
      async fetchCompetitorSerpData(request) {
        assert.equal(request.domain, "stripe.example")
        assert.equal(JSON.stringify(request.keywords), JSON.stringify([
          "payments api pricing",
          "best payment processing software",
          "merchant services",
        ]))
        return {
          competitors: [
            {
              domain: "adyen.com",
              kind: "strategic_competitor",
              label: "competitor domain",
              intersections: 5,
              avgPosition: 7.2,
              targetTraffic: 1800,
              competitorTraffic: 2600,
              provenance: "measured",
            },
            {
              domain: "g2.com",
              kind: "marketplace",
              label: "marketplace ranking above you",
              intersections: 4,
              avgPosition: 4.1,
              targetTraffic: null,
              competitorTraffic: 9000,
              provenance: "measured",
            },
          ],
        }
      },
      async fetchSerpPositions() {
        return {
          domains: [
            {
              domain: "stripe.example",
              provenance: "measured",
              keywords: [
                { keyword: "payments api pricing", monthlyVolume: 1200, position: 3, provenance: "measured" },
                { keyword: "best payment processing software", monthlyVolume: 800, position: 8, provenance: "measured" },
              ],
            },
            {
              domain: "adyen.com",
              provenance: "measured",
              keywords: [
                { keyword: "payments api pricing", monthlyVolume: 1200, position: 1, provenance: "measured" },
                { keyword: "merchant services", monthlyVolume: 300, position: 4, valuePerClick: 12, provenance: "measured" },
              ],
            },
            {
              domain: "g2.com",
              provenance: "measured",
              keywords: [
                { keyword: "best payment processing software", monthlyVolume: 800, position: 2, provenance: "measured" },
              ],
            },
          ],
        }
      },
      async fetchBacklinkSummaries() {
        return {
          summaries: [
            { domain: "stripe.example", referringDomains: 1200, referringMainDomains: 1100, provenance: "measured" },
            { domain: "adyen.com", referringDomains: 2200, referringMainDomains: 2000, provenance: "measured" },
            { domain: "g2.com", referringDomains: 3100, referringMainDomains: 2900, provenance: "measured" },
          ],
        }
      },
    },
  )
}).then((competitive) => {
  assert.equal(competitive.status, "measured")
  assert.equal(competitive.caps.keyword_count, 3)
  assert.equal(competitive.caps.competitor_count, 2)
  assert.equal(competitive.provenance.battlefield, "measured")
  assert.equal(competitive.battlefield[0].domain, "adyen.com")
  assert.equal(competitive.battlefield[0].narrative.name, "Adyen")
  assert.equal(competitive.battlefield[0].shareOfVoice, 0.5667)
  assert.equal(competitive.battlefield[0].yourShareOfVoice, 0.3667)
  assert.equal(competitive.battlefield[0].referringDomains, 2200)
  assert.equal(competitive.diagnosis.rows[0].domain, "stripe.example")
  assert.equal(competitive.diagnosis.rows[0].shareOfVoice, 0.3667)
  assert.equal(competitive.diagnosis.rows[1].authorityDeficit, 1000)
  assert.equal(competitive.bleeding[0].keyword, "merchant services")
  assert.equal(competitive.bleeding[0].monthlyVolume, 300)
  assert.equal(competitive.bleeding[0].bestCompetitorPosition, 4)
  assert.equal(competitive.cost.revenueAtRisk.monthly, 302)
  assert.equal(competitive.cost.revenueAtRisk.provenance, "inferred")
  assert.equal(competitive.cost.revenueAtRisk.formula.expression, "sum(search_volume * position_ctr * value_per_click)")
  assert.equal(competitive.cost.revenueAtRisk.formula.inputs[0].sources.search_volume, "Hubbly Intelligence ranked keyword volume")
  assert.equal(competitive.cost.revenueAtRisk.formula.inputs[0].sources.position_ctr, "standard organic CTR curve")
  assert.equal(competitive.cost.revenueAtRisk.formula.inputs[0].sources.value_per_click, "Hubbly Intelligence keyword CPC")
  assert.equal(competitive.cost.authorityDeficit[0].provenance, "measured")
  assert.equal(competitive.bleedingMonthly, 300)
  assert.equal(competitive.marketplaces[0].domain, "g2.com")
  assert.equal(competitive.named_without_serp_presence[0].name, "Checkout.com")

  return buildCompetitiveIntelligenceForTest(stripeProfile, [], insufficientIntent, {
    async fetchCompetitorSerpData() {
      return { competitors: [] }
    },
    async fetchSerpPositions() {
      throw new Error("positions should not be fetched without measured domains")
    },
    async fetchBacklinkSummaries() {
      throw new Error("backlinks should not be fetched without measured domains")
    },
  })
}).then((emptyCompetitive) => {
  assert.equal(emptyCompetitive.status, "insufficient_signal")
  assert.equal(JSON.stringify(emptyCompetitive.battlefield), "[]")

  return buildCompetitiveIntelligenceForTest(stripeProfile, [], measuredIntent, {
    async fetchCompetitorSerpData() {
      throw new DOMException("The operation was aborted due to timeout", "TimeoutError")
    },
    async fetchSerpPositions() {
      throw new Error("positions should not be fetched after competitor timeout")
    },
    async fetchBacklinkSummaries() {
      throw new Error("backlinks should not be fetched after competitor timeout")
    },
  })
}).then((vendorErrorCompetitive) => {
  assert.equal(vendorErrorCompetitive.status, "data_unavailable")
  assert.equal(vendorErrorCompetitive.provenance.competitor_domains, "data_unavailable")
  assert.equal(vendorErrorCompetitive.error.type, "vendor_timeout")
  assert.match(vendorErrorCompetitive.label, /temporarily unavailable/i)

  console.log("hubbly intelligence: 1 passed")
}).catch((error) => {
  console.error(error)
  process.exit(1)
})
