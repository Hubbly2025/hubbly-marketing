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
    throw new Error("fetch should not run in audit helper tests")
  },
  AbortSignal,
  setTimeout,
  clearTimeout,
}
sandbox.exports = sandbox.module.exports
vm.runInNewContext(compiled, sandbox, { filename: sourcePath })

const {
  buildSiteProfileForTest,
  estimateIntentDataForTest,
} = sandbox.module.exports

function termsFrom(value) {
  return JSON.stringify(value).toLowerCase().match(/[a-z0-9_ -]+/g) ?? []
}

function assertNoDefaultTerm(value) {
  assert(!termsFrom(value).some((term) => term.split(/[^a-z0-9_]+/).includes("default")))
}

const scannedAt = "2026-06-21T12:00:00.000Z"

const stripeProfile = buildSiteProfileForTest({
  domain: "stripe.example",
  scannedAt,
  analysis: {
    company_name: "Stripe",
    product: "Payments infrastructure and APIs for internet businesses.",
    industry: "Payments infrastructure",
    icp: {
      primary: {
        title: "Head of payments",
      },
    },
    outreach_angle: "Programmable financial infrastructure for businesses that need to accept payments online.",
  },
  scrapedContent: "Stripe is financial infrastructure for the internet. Millions of businesses use Stripe's software and APIs to accept payments, send payouts, and manage online commerce.",
})

const restaurantProfile = buildSiteProfileForTest({
  domain: "joes-crab-shack.example",
  scannedAt,
  analysis: {
    company_name: "Joe's Crab Shack",
    product: "Casual seafood restaurant with crab buckets, cocktails, and family dining.",
    industry: "Seafood restaurant",
    business_model: "b2c_restaurant_franchise",
    buyer_type: "consumer",
    category: "casual_seafood_restaurant",
    icp: {
      primary: {
        title: "Local diner",
      },
    },
    outreach_angle: "Fresh seafood, crab buckets, and casual waterfront dining for families and groups.",
  },
  scrapedContent: "Joe's Crab Shack serves seafood, crab buckets, shrimp, cocktails, and family dinners. View our menu, find a location near you, and make a reservation.",
})

assert.equal(stripeProfile.buyer_type, "business")
assert.equal(stripeProfile.business_model, "b2b_saas")
assert.equal(stripeProfile.category, "payments")
assert.equal(restaurantProfile.buyer_type, "consumer")
assert.equal(restaurantProfile.business_model, "local_service")
assert.equal(restaurantProfile.category, "seafood_restaurant")
assert.notEqual(stripeProfile.category, restaurantProfile.category)

assertNoDefaultTerm(stripeProfile)
assertNoDefaultTerm(restaurantProfile)

const stripeWithIncidentalConsumerCopy = buildSiteProfileForTest({
  domain: "stripe.example",
  scannedAt,
  analysis: {
    company_name: "Stripe",
    product: "Financial infrastructure for businesses.",
    industry: "Payments infrastructure",
    icp: {
      primary: {
        title: "Head of payments",
      },
    },
    outreach_angle: "Businesses use Stripe to accept payments from consumers around the world.",
  },
  scrapedContent: "Businesses use Stripe APIs to accept payments from consumers, manage billing, and move money.",
})

assert.equal(stripeWithIncidentalConsumerCopy.business_model, "b2b_saas")
assert.equal(stripeWithIncidentalConsumerCopy.category, "payments")
assert.equal(stripeWithIncidentalConsumerCopy.buyer_type, "business")

const stripeWithIncidentalRestaurantTestimonial = buildSiteProfileForTest({
  domain: "stripe.example",
  scannedAt,
  analysis: {
    company_name: "Stripe",
    product: "Programmable financial infrastructure for businesses to accept payments online and in person.",
    industry: "Payments and financial infrastructure",
    business_model: "b2b_saas",
    buyer_type: "business",
    category: "payment_processing_infrastructure",
    icp: {
      primary: {
        title: "Head of payments",
      },
    },
    outreach_angle: "Stripe helps businesses manage payments, billing, checkout, merchant acquiring, and payouts.",
  },
  scrapedContent: "Stripe provides programmable financial infrastructure that lets businesses accept payments online and in person, automate billing and payouts, and manage checkout. Goodtill partners with Stripe to onboard 400+ new restaurants in under 4 weeks.",
})

assert.equal(stripeWithIncidentalRestaurantTestimonial.business_model, "b2b_saas")
assert.equal(stripeWithIncidentalRestaurantTestimonial.category, "payments")
assert.equal(stripeWithIncidentalRestaurantTestimonial.buyer_type, "business")

const priorityGoldProfile = buildSiteProfileForTest({
  domain: "prioritygold.com",
  scannedAt,
  analysis: {
    company_name: "Priority Gold",
    product: "Priority Gold sells physical gold, silver, platinum, and palladium coins and bars and helps customers set up precious metals IRAs.",
    industry: "Precious metals dealing and gold IRA services",
    business_model: "b2c_ecommerce",
    buyer_type: "consumer",
    category: "precious_metals_dealer",
    icp: {
      primary: {
        title: "Individual investor",
      },
    },
    outreach_angle: "Gold IRA rollover and precious metals investing for retirement savers.",
  },
  scrapedContent: "0.5 oz United States Mint proof gold American Eagle coins. Priority Gold helps customers buy gold, silver, and precious metals for retirement investment and IRA rollover planning.",
})

assert.equal(priorityGoldProfile.category, "gold_ira")
assert.equal(priorityGoldProfile.raw_category, "precious_metals_dealer")
assert.notEqual(priorityGoldProfile.category, "home_services")

const proofGoldFallbackProfile = buildSiteProfileForTest({
  domain: "proof-gold.example",
  scannedAt,
  analysis: {
    company_name: "Proof Gold",
    product: "Proof gold American Eagle coins for collectors and retirement investors.",
    industry: "Precious metals",
    business_model: "b2c_ecommerce",
    buyer_type: "consumer",
    category: "unknown",
    icp: {
      primary: {
        title: "Individual investor",
      },
    },
  },
  scrapedContent: "0.5 oz United States Mint proof gold American Eagle coins for retirement investment and precious metals buyers.",
})

assert.equal(proofGoldFallbackProfile.category, "gold_ira")
assert.notEqual(proofGoldFallbackProfile.category, "home_services")

const unmappedConfidentProfile = buildSiteProfileForTest({
  domain: "widgets.example",
  scannedAt,
  analysis: {
    company_name: "Widget Co",
    product: "Autonomous procurement workspace for quantum widget operations.",
    industry: "Quantum widget operations",
    business_model: "b2b_services",
    buyer_type: "business",
    category: "quantum_widget_operations",
    icp: {
      primary: {
        title: "Operations leader",
      },
    },
  },
  scrapedContent: "Quantum widget teams coordinate specialized operations, compliance reviews, and vendor workflows.",
})

assert.equal(unmappedConfidentProfile.category, null)
assert.equal(unmappedConfidentProfile.raw_category, "quantum_widget_operations")

Promise.all([
  estimateIntentDataForTest(stripeProfile, {
    async fetchKeywordDemand() {
      return {
        keywords: [
          { keyword: "payments API pricing", monthlyVolume: 1200 },
          { keyword: "payment processing software", monthlyVolume: 800 },
        ],
      }
    },
  }),
  estimateIntentDataForTest(restaurantProfile, {
    async fetchKeywordDemand() {
      return {
        keywords: [
          { keyword: "seafood restaurant near me", monthlyVolume: 900 },
          { keyword: "crab shack menu", monthlyVolume: 500 },
        ],
      }
    },
  }),
  estimateIntentDataForTest(priorityGoldProfile, {
    async fetchKeywordDemand(request) {
      assert.equal(request.category, "gold_ira")
      return {
        keywords: [
          { keyword: "gold ira", monthlyVolume: 5000 },
          { keyword: "precious metals ira", monthlyVolume: 1200 },
        ],
      }
    },
  }),
  estimateIntentDataForTest(unmappedConfidentProfile, {
    async fetchKeywordDemand(request) {
      assert.equal(request.category, "quantum_widget_operations")
      return {
        keywords: [
          { keyword: "quantum widget operations", monthlyVolume: 100 },
        ],
      }
    },
  }),
]).then(([stripeIntent, restaurantIntent, priorityGoldIntent, unmappedIntent]) => {
  assert.equal(stripeIntent.status, "measured")
  assert.equal(restaurantIntent.status, "measured")
  assert.equal(priorityGoldIntent.status, "measured")
  assert.equal(unmappedIntent.status, "measured")
  assert.equal(JSON.stringify(stripeIntent.top_signals), JSON.stringify([
    "payments api pricing",
    "payment processing software",
  ]))
  assert.equal(JSON.stringify(restaurantIntent.top_signals), JSON.stringify([
    "seafood restaurant near me",
    "crab shack menu",
  ]))
  assert.equal(JSON.stringify(priorityGoldIntent.top_signals), JSON.stringify([
    "gold ira",
    "precious metals ira",
  ]))
  assert.equal(JSON.stringify(unmappedIntent.top_signals), JSON.stringify([
    "quantum widget operations",
  ]))
  assert.notDeepEqual(stripeIntent.top_signals, restaurantIntent.top_signals)
  assert.equal(JSON.stringify(stripeIntent.geographies), "[]")
  assert.equal(JSON.stringify(restaurantIntent.geographies), "[]")
  assertNoDefaultTerm(stripeIntent)
  assertNoDefaultTerm(restaurantIntent)

  console.log("audit process helpers: 1 passed")
}).catch((error) => {
  console.error(error)
  process.exit(1)
})
