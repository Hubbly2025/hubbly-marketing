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
      throw new Error("fetch should not run in game plan tests")
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
  buildConstrainedGamePlanForTest,
  containsOutcomeGuaranteeForTest,
} = loadTsModule("lib/audit/process-audit.ts")

const modelConfig = {
  provider: "anthropic",
  model: "claude-opus-4-8",
  version: "4.8",
  tier: "free",
  flippable_to: "claude-sonnet-4-6",
}

const competitiveIntelligence = {
  status: "measured",
  diagnosis: {
    rows: [
      {
        domain: "stripe.example",
        kind: "target",
        shareOfVoice: 0.2,
        referringDomains: 100,
        authorityDeficit: 0,
        provenance: "measured",
      },
      {
        domain: "adyen.com",
        kind: "strategic_competitor",
        shareOfVoice: 0.6,
        referringDomains: 500,
        authorityDeficit: 400,
        provenance: "measured",
      },
    ],
  },
  bleeding: [
    {
      keyword: "payment processing software",
      monthlyVolume: 800,
      competitorDomains: ["adyen.com"],
      provenance: "measured",
    },
  ],
  cost: {
    revenueAtRisk: {
      monthly: 1200,
      provenance: "inferred",
    },
  },
}

async function run() {
  let capturedPrompt = ""
  const tier1Plan = await buildConstrainedGamePlanForTest({
    companyName: "Stripe",
    analysis: {
      product: "Payments infrastructure",
      industry: "Payments",
      business_model: "b2b_saas",
      buyer_type: "business",
      category: "payments",
    },
    competitiveIntelligence,
    modelConfig,
    env: {},
    synthesize: async (prompt) => {
      capturedPrompt = prompt
      return {
        status: "recommendation",
        moves: [
          {
            title: "Tighten the on-page layer",
            capability_id: "rank.on_page_optimization",
            measured_gap: "adyen.com has higher measured share of voice (0.6) than the target (0.2).",
            why_this: "The on-page engine can align titles, headers, and page copy to the measured gap.",
            plan: "Prioritize the page elements connected to the measured competitor keyword gaps.",
          },
        ],
      }
    },
  })

  assert.equal(tier1Plan.status, "recommendation")
  assert.equal(tier1Plan.moves[0].capability_id, "rank.on_page_optimization")
  assert(!capturedPrompt.includes("rank.content_generation"))
  assert(!capturedPrompt.includes("rank.autonomous_publish"))

  const gatedPlan = await buildConstrainedGamePlanForTest({
    companyName: "Stripe",
    analysis: {},
    competitiveIntelligence,
    modelConfig,
    env: {},
    synthesize: async () => ({
      status: "recommendation",
      moves: [
        {
          title: "Build comparison content",
          capability_id: "rank.content_generation",
          measured_gap: "The target is invisible for measured competitor keywords: payment processing software (800 measured monthly searches).",
          plan: "Plan comparison content around the measured gap.",
        },
      ],
    }),
  })
  assert.equal(gatedPlan.status, "analysis_pending")
  assert.equal(gatedPlan.label, "Game plan generating…")

  let contentPrompt = ""
  const contentEnabledPlan = await buildConstrainedGamePlanForTest({
    companyName: "Stripe",
    analysis: {},
    competitiveIntelligence,
    modelConfig,
    env: { RANK_CONTENT_ENABLED: "true" },
    synthesize: async (prompt) => {
      contentPrompt = prompt
      return {
        status: "recommendation",
        moves: [
          {
            title: "Plan content against measured gaps",
            capability_id: "rank.content_generation",
            measured_gap: "The target is invisible for measured competitor keywords: payment processing software (800 measured monthly searches).",
            plan: "Use the enabled content pipeline to address the measured keyword gap as a plan, not a promised outcome.",
          },
        ],
      }
    },
  })
  assert(contentPrompt.includes("rank.content_generation"))
  assert.equal(contentEnabledPlan.status, "recommendation")
  assert.equal(contentEnabledPlan.moves[0].capability_id, "rank.content_generation")

  const pendingPlan = await buildConstrainedGamePlanForTest({
    companyName: "Stripe",
    analysis: {},
    competitiveIntelligence,
    modelConfig,
    synthesize: async () => {
      throw new Error("model unavailable")
    },
  })
  assert.equal(pendingPlan.status, "analysis_pending")
  assert.equal(pendingPlan.label, "Game plan generating…")

  assert.equal(containsOutcomeGuaranteeForTest("This plan is projected to help"), false)
  assert.equal(containsOutcomeGuaranteeForTest("Projected to improve topical relevance; outcomes are not guaranteed."), false)
  assert.equal(containsOutcomeGuaranteeForTest("No ranking or placement outcome is guaranteed."), false)
  assert.equal(containsOutcomeGuaranteeForTest("This will rank #1"), true)
  assert.equal(containsOutcomeGuaranteeForTest("Guaranteed first-page traffic lift."), true)

  console.log("game plan: 1 passed")
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
