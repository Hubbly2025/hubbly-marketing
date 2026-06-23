const assert = require("node:assert/strict")
const { validateResults, createFetchCapture, loadTsModule } = require("../../scripts/validate-real-scan.js")

const goodInput = {
  scans: {
    stripe: auditPayload("stripe.com", {
      h1: "Financial infrastructure to grow your revenue",
      primary_cta_text: "Start now",
    }),
    joes: auditPayload("joescrabshack.com", {
      h1: "Joe's Crab Shack",
      primary_cta_text: "Find a location",
    }),
  },
  captures: {
    anthropic: [
      { status: 200, request: { model: "claude-opus-4-8" } },
      { status: 200, request: { model: "claude-opus-4-8" } },
    ],
    vendorEndpoints: [
      endpoint("/keywords_data/google_ads/search_volume/live", {
        status_code: 20000,
        status_message: "Ok.",
        cost: 0.075,
        tasks_count: 1,
        tasks_error: 0,
        tasks: [{ status_code: 20000, status_message: "Ok.", result: [{
          keyword: "payments api pricing",
          search_volume: 1200,
          competition: "HIGH",
          competition_index: 81,
        }] }],
      }),
      endpoint(("/data" + "forseo_labs/google") + "/competitors_domain/live", {
        tasks: [{ result: [{ items: [{
          domain: "adyen.com",
          avg_position: 7.2,
          intersections: 5,
        }] }] }],
      }),
      endpoint(("/data" + "forseo_labs/google") + "/ranked_keywords/live", {
        tasks: [{ result: [{ items: [{
          keyword_data: {
            keyword: "payments api pricing",
            keyword_info: { search_volume: 1200 },
          },
          ranked_serp_element: {
            serp_item: { rank_group: 1 },
          },
        }] }] }],
      }),
      endpoint("/serp/google/organic/live/advanced", {
        tasks: [{ result: [{ items: [{ domain: "adyen.com", rank_absolute: 1 }] }] }],
      }),
      endpoint("/backlinks/summary/live", {
        status_code: 20000,
        status_message: "Ok.",
        cost: 0,
        tasks_count: 1,
        tasks_error: 0,
        tasks: [{ status_code: 20000, status_message: "Ok.", result: [{ target: "adyen.com", referring_domains: 2200 }] }],
      }),
    ],
  },
  renderedOutput: JSON.stringify({ title: "Hubbly Intelligence report" }),
}

const good = validateResults(goodInput)
assert.equal(good.checks.length, 8)
assert.equal(good.checks.filter((check) => check.pass).length, 8)

const faultInput = JSON.parse(JSON.stringify(goodInput))
faultInput.scans.stripe.intent_data.highIntent = faultInput.scans.stripe.intent_data.monthly
faultInput.scans.stripe.competitive_intelligence.battlefield[0].domain_source = "llm_guess"
faultInput.renderedOutput = "Rendered output leaked Data" + "ForSEO"

const fault = validateResults(faultInput)
const failingIds = fault.checks.filter((check) => !check.pass).map((check) => check.id)
assert(failingIds.includes("high_intent_subset"))
assert(failingIds.includes("battlefield_measured_domains"))
assert(failingIds.includes("vendor_walling"))

capturePostJsonSeam().then(() => {
  console.log("validate real scan harness: 1 passed")
}).catch((error) => {
  console.error(error)
  process.exit(1)
})

async function capturePostJsonSeam() {
  const capture = createFetchCapture()
  const restoreCapture = capture.install()
  const wrappedFetch = globalThis.fetch

  try {
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      async json() {
        return {
          tasks: [{ result: [{ items: [{ keyword: "payments api", search_volume: 1200 }] }] }],
        }
      },
    })

    const { createHubblyIntelligenceClient } = loadTsModule("lib/audit/hubbly-intelligence.ts")
    await createHubblyIntelligenceClient({
      apiKey: "login:password",
      baseUrl: "https://example.test/v3",
      cadence: { free: "on_demand", autopilot: "weekly", workforce: "daily" },
    }).fetchKeywordDemand({
      domain: "stripe.example",
      category: "payments",
      buyerType: "business",
      businessModel: "b2b_saas",
    })

    const endpoints = capture.getCaptures().vendorEndpoints
    assert.equal(endpoints.length, 1)
    assert.equal(endpoints[0].url, "https://example.test/v3/keywords_data/google_ads/search_volume/live")
    assert.equal(endpoints[0].response.tasks[0].result[0].items[0].search_volume, 1200)
  } finally {
    globalThis.fetch = wrappedFetch
    restoreCapture()
  }
}

function endpoint(path, response) {
  return {
    url: `https://example.test/v3${path}`,
    status: 200,
    ok: true,
    request: [{}],
    response,
  }
}

function auditPayload(domain, observedEvidence) {
  return {
    id: domain,
    status: "complete",
    url: `https://${domain}`,
    analysis: {
      company_name: domain,
      audit_debug: {
        current_step: "complete",
        progress_percent: 100,
      },
      model_provenance: {
        model: "claude-opus-4-8",
        version: "4.8",
        tier: "free",
      },
      site_profile: {
        domain,
        scanned_at: "2026-06-21T12:00:00.000Z",
        observed_evidence: observedEvidence,
        provenance: {
          observed_evidence: "measured",
          model: {
            model: "claude-opus-4-8",
            version: "4.8",
            tier: "free",
          },
        },
      },
    },
    intent_data: {
      status: "measured",
      monthly: 2300,
      highIntent: 1200,
      high_intent: 1200,
      keyword_volumes: [
        { keyword: "payments api pricing", monthlyVolume: 1200 },
        { keyword: "payment processing software", monthlyVolume: 800 },
      ],
      geographies: [],
      provenance: {
        monthly: "measured",
        highIntent: "measured",
        keyword_volumes: "measured",
        geographies: "estimated",
      },
    },
    competitive_intelligence: {
      status: "measured",
      battlefield: [
        {
          domain: "adyen.com",
          shareOfVoice: 0.56,
          referringDomains: 2200,
          provenance: "measured",
        },
      ],
      marketplaces: [],
      bleeding: [
        {
          keyword: "merchant services",
          monthlyVolume: 300,
          competitorDomains: ["adyen.com"],
          provenance: "measured",
        },
      ],
      provenance: {
        competitor_domains: "measured",
        battlefield: "measured",
        bleeding: "measured",
        backlinks: "measured",
      },
    },
  }
}
