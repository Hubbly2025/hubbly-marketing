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
        return loadTsModule("lib/audit/scan-model-config.ts")
      }
      return require(specifier)
    },
    process,
    console,
    URL,
    fetch: () => {
      throw new Error("fetch should not run in model policy tests")
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

const { scanModelPolicyForTest, buildSiteProfileForTest } = loadTsModule("lib/audit/process-audit.ts")

assert.equal(scanModelPolicyForTest.free.model, "claude-opus-4-8")
assert.equal(scanModelPolicyForTest.free.version, "4.8")
assert.equal(scanModelPolicyForTest.free.flippable_to, "claude-sonnet-4-6")
assert.equal(scanModelPolicyForTest.paid.model, "claude-opus-4-8")
assert.equal(scanModelPolicyForTest.paid.version, "4.8")
assert(!scanModelPolicyForTest.free.model.includes("latest"))
assert(!scanModelPolicyForTest.paid.model.includes("latest"))

const profile = buildSiteProfileForTest({
  domain: "stripe.example",
  scannedAt: "2026-06-21T12:00:00.000Z",
  analysis: {
    product: "Payments infrastructure.",
    industry: "Payments infrastructure",
    icp: { primary: { title: "Head of payments" } },
  },
  scrapedContent: "Stripe offers payments APIs for businesses.",
})

assert.equal(profile.provenance.model.model, "claude-opus-4-8")
assert.equal(profile.provenance.model.version, "4.8")
assert.equal(profile.provenance.model.tier, "free")
assert.equal(profile.provenance.model.provider, undefined)

console.log("model policy: 1 passed")
