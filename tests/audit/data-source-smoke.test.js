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

console.log("audit data source smoke validator: 1 passed")
