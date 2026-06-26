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
    throw new Error("fetch should not run in vocab tests")
  },
  AbortSignal,
  setTimeout,
  clearTimeout,
}
sandbox.exports = sandbox.module.exports
vm.runInNewContext(compiled, sandbox, { filename: sourcePath })

const {
  siteProfileVocabVersionForTest,
  normalizeSiteProfileValuesForTest,
} = sandbox.module.exports

assert.equal(siteProfileVocabVersionForTest, "site-profile-vocab.v1")

const cases = [
  {
    input: { business_model: "SaaS platform", buyer_type: "B2B team", category: "payments API" },
    expected: { business_model: "b2b_saas", buyer_type: "business", category: "payments" },
  },
  {
    input: { business_model: "b2b_saas", buyer_type: "business", category: "payment_processing_infrastructure" },
    expected: { business_model: "b2b_saas", buyer_type: "business", category: "payments" },
  },
  {
    input: { business_model: "b2b_saas", buyer_type: "business", category: "payment_processing_platform" },
    expected: { business_model: "b2b_saas", buyer_type: "business", category: "payments" },
  },
  {
    input: { business_model: "b2c_ecommerce", buyer_type: "consumer", category: "precious_metals_dealer" },
    expected: { business_model: "b2c_ecommerce", buyer_type: "consumer", category: "gold_ira" },
  },
  {
    input: { business_model: "restaurant", buyer_type: "consumer", category: "casual_seafood_restaurant" },
    expected: { business_model: "local_service", buyer_type: "consumer", category: "seafood_restaurant" },
  },
  {
    input: { business_model: "b2b_saas", buyer_type: "business", category: "payments_infrastructure" },
    expected: { business_model: "b2b_saas", buyer_type: "business", category: "payments" },
  },
  {
    input: { business_model: "b2b_services", buyer_type: "business", category: "business_services_platform" },
    expected: { business_model: "b2b_services", buyer_type: "business", category: null },
  },
  {
    input: { business_model: "restaurant", buyer_type: "Local diner", category: "seafood restaurant" },
    expected: { business_model: "local_service", buyer_type: "consumer", category: "seafood_restaurant" },
  },
  {
    input: { business_model: "consumer financial services", buyer_type: "individual investor", category: "gold IRA" },
    expected: { business_model: "b2c_financial_services", buyer_type: "consumer", category: "gold_ira" },
  },
]

for (const testCase of cases) {
  assert.equal(
    JSON.stringify(normalizeSiteProfileValuesForTest(testCase.input)),
    JSON.stringify(testCase.expected),
  )
}

console.log("site profile vocab: 1 passed")
