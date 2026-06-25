const assert = require("node:assert/strict")
const { validateAuditPayload } = require("../../scripts/audit-data-source-smoke.js")

const mislabeledVendorError = {
  audit: {
    id: "vendor-timeout-mislabeled",
    analysis: {
      model_provenance: {
        model: "claude-opus-4-8",
        version: "4.8",
        tier: "free",
      },
      site_profile: {
        observed_evidence: {
          h1: "Example",
        },
        provenance: {
          observed_evidence: "measured",
        },
      },
    },
    intent_data: {
      status: "insufficient_signal",
      error: {
        type: "vendor_timeout",
        message: "Hubbly Intelligence timed out.",
      },
      monthly: 0,
      highIntent: 0,
      keyword_volumes: [],
      provenance: {
        monthly: "estimated",
        highIntent: "estimated",
        keyword_volumes: "estimated",
      },
    },
    competitive_intelligence: {
      status: "insufficient_signal",
      battlefield: [],
      marketplaces: [],
      bleeding: [],
      provenance: {
        competitor_domains: "estimated",
        battlefield: "estimated",
        marketplaces: "estimated",
        bleeding: "estimated",
        backlinks: "estimated",
      },
    },
  },
}

const failures = validateAuditPayload(mislabeledVendorError, "vendor-timeout-mislabeled")
assert(failures.some((failure) => failure.includes("vendor error is mislabeled insufficient_signal")))

const revenueWithoutFormula = {
  audit: {
    id: "revenue-without-formula",
    analysis: {
      model_provenance: {
        model: "claude-opus-4-8",
        version: "4.8",
        tier: "free",
      },
    },
    intent_data: {
      status: "measured",
      monthly: 1000,
      highIntent: 200,
      keyword_volumes: [{ keyword: "payments api", monthlyVolume: 1000 }],
      provenance: {
        monthly: "measured",
        highIntent: "measured",
        keyword_volumes: "measured",
      },
    },
    competitive_intelligence: {
      status: "measured",
      battlefield: [],
      marketplaces: [],
      bleeding: [],
      cost: {
        revenueAtRisk: {
          monthly: 1200,
          provenance: "inferred",
        },
      },
      provenance: {
        competitor_domains: "measured",
        battlefield: "measured",
        bleeding: "measured",
        backlinks: "measured",
      },
    },
  },
}

const revenueFailures = validateAuditPayload(revenueWithoutFormula, "revenue-without-formula")
assert(revenueFailures.some((failure) => failure.includes("revenue-at-risk is missing an attached formula")))

const disallowedGamePlan = {
  audit: {
    id: "disallowed-game-plan",
    analysis: {
      model_provenance: {
        model: "claude-opus-4-8",
        version: "4.8",
        tier: "free",
      },
    },
    gtm_plan: {
      status: "recommendation",
      moves: [
        {
          capability_id: "rank.paid_ads",
          title: "Launch ads",
          measured_gap: "Competitor has higher measured share of voice.",
          plan: "Plan paid media around that gap.",
          provenance: "recommendation",
        },
      ],
      provenance: "recommendation",
    },
    intent_data: {
      status: "insufficient_signal",
      monthly: 0,
      highIntent: 0,
      keyword_volumes: [],
      provenance: {},
    },
    competitive_intelligence: {
      status: "insufficient_signal",
      provenance: {},
    },
  },
}

const disallowedPlanFailures = validateAuditPayload(disallowedGamePlan, "disallowed-game-plan")
assert(disallowedPlanFailures.some((failure) => failure.includes("capability that is not allowed or enabled")))

const gatedGamePlan = {
  audit: {
    id: "gated-game-plan",
    analysis: {
      model_provenance: {
        model: "claude-opus-4-8",
        version: "4.8",
        tier: "free",
      },
    },
    gtm_plan: {
      status: "recommendation",
      moves: [
        {
          capability_id: "rank.content_generation",
          title: "Build content",
          measured_gap: "Competitor owns measured comparison keywords.",
          plan: "Plan a content pipeline around those gaps.",
          provenance: "recommendation",
        },
      ],
      provenance: "recommendation",
    },
    intent_data: {
      status: "insufficient_signal",
      monthly: 0,
      highIntent: 0,
      keyword_volumes: [],
      provenance: {},
    },
    competitive_intelligence: {
      status: "insufficient_signal",
      provenance: {},
    },
  },
}

delete process.env.RANK_CONTENT_ENABLED
const gatedPlanFailures = validateAuditPayload(gatedGamePlan, "gated-game-plan")
assert(gatedPlanFailures.some((failure) => failure.includes("RANK_CONTENT_ENABLED is false")))

const guaranteedGamePlan = {
  audit: {
    id: "guaranteed-game-plan",
    analysis: {
      model_provenance: {
        model: "claude-opus-4-8",
        version: "4.8",
        tier: "free",
      },
    },
    gtm_plan: {
      status: "recommendation",
      moves: [
        {
          capability_id: "rank.on_page_optimization",
          title: "Guaranteed first page",
          measured_gap: "Competitor has higher measured share of voice.",
          plan: "This will rank #1 after optimization.",
          provenance: "recommendation",
        },
      ],
      provenance: "recommendation",
    },
    intent_data: {
      status: "insufficient_signal",
      monthly: 0,
      highIntent: 0,
      keyword_volumes: [],
      provenance: {},
    },
    competitive_intelligence: {
      status: "insufficient_signal",
      provenance: {},
    },
  },
}

const guaranteeFailures = validateAuditPayload(guaranteedGamePlan, "guaranteed-game-plan")
assert(guaranteeFailures.some((failure) => failure.includes("guarantee or outcome-promise")))

console.log("audit data source smoke validator: 1 passed")
