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
]).then(([stripeIntent, restaurantIntent]) => {
  assert.equal(stripeIntent.status, "measured")
  assert.equal(restaurantIntent.status, "measured")
  assert.equal(JSON.stringify(stripeIntent.top_signals), JSON.stringify([
    "payments api pricing",
    "payment processing software",
  ]))
  assert.equal(JSON.stringify(restaurantIntent.top_signals), JSON.stringify([
    "seafood restaurant near me",
    "crab shack menu",
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
