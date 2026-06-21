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
      if (specifier === "./scan-model-config") {
        return loadTsModule("lib/audit/scan-model-config.ts")
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
        { keyword: "1/2 oz payment coin", monthlyVolume: 0 },
      ],
    }
  },
}

buildMeasuredIntentDataForTest(stripeProfile, measuredClient).then((intent) => {
  assert.equal(intent.status, "measured")
  assert.equal(intent.monthly, 2000)
  assert.equal(intent.weekly, undefined)
  assert.equal(intent.highIntent, 1200)
  assert.notEqual(intent.highIntent, intent.monthly)
  assert.equal(JSON.stringify(intent.top_signals), JSON.stringify([
    "payments api pricing",
    "best payment processing software",
  ]))
  assert.equal(intent.provenance.monthly, "measured")
  assert.equal(intent.provenance.top_signals, "measured")

  return buildMeasuredIntentDataForTest(stripeProfile, {
    async fetchKeywordDemand() {
      return { keywords: [] }
    },
  })
}).then((emptyIntent) => {
  assert.equal(emptyIntent.status, "insufficient_signal")
  assert.equal(emptyIntent.monthly, 0)
  assert.equal(JSON.stringify(emptyIntent.top_signals), "[]")

  assert.equal(normalizeIntentKeyword("1 oz gold ira"), "1 oz gold ira")
  assert.equal(normalizeIntentKeyword("1/2 oz gold ira"), "1/2 oz gold ira")
  assert.equal(normalizeIntentKeyword("software for ops"), "software for ops")
  assert(!normalizeIntentKeyword("1 oz").includes("0z"))

  console.log("hubbly intelligence: 1 passed")
}).catch((error) => {
  console.error(error)
  process.exit(1)
})
