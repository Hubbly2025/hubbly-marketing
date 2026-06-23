const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")
const vm = require("node:vm")

function loadTsModule(relativePath, fetchImpl) {
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
      if (specifier === "./hubbly-intelligence-config") {
        return loadTsModule("lib/audit/hubbly-intelligence-config.ts", fetchImpl)
      }
      if (specifier === "./site-profile-vocab.v1.json") {
        return require(path.join(__dirname, "..", "..", "lib/audit/site-profile-vocab.v1.json"))
      }
      return require(specifier)
    },
    process,
    console,
    Buffer,
    URL,
    fetch: fetchImpl,
    AbortSignal,
    setTimeout,
    clearTimeout,
  }
  sandbox.exports = sandbox.module.exports
  vm.runInNewContext(compiled, sandbox, { filename: sourcePath })
  return sandbox.module.exports
}

const calls = []
const labsPath = "/data" + "forseo_labs/google"
const fetchImpl = async (url, init) => {
  calls.push({ url, init, body: JSON.parse(init.body) })

  if (url.endsWith(`${labsPath}/competitors_domain/live`)) {
    return jsonResponse({
      tasks: [{
        status_code: 20000,
        result: [{
          items: [
            {
              se_type: "google",
              domain: "adyen.com",
              avg_position: 7.2,
              sum_position: 36,
              intersections: 5,
              full_domain_metrics: { organic: { etv: 42000 } },
              metrics: { organic: { etv: 1800 } },
              competitor_metrics: { organic: { etv: 2600 } },
            },
            {
              se_type: "google",
              domain: "g2.com",
              avg_position: 4.1,
              sum_position: 12,
              intersections: 4,
              competitor_metrics: { organic: { etv: 9000 } },
            },
          ],
        }],
      }],
    })
  }

  if (url.endsWith(`${labsPath}/ranked_keywords/live`)) {
    const target = calls.at(-1).body[0].target
    return jsonResponse({
      tasks: [{
        status_code: 20000,
        result: [{
          items: rankedKeywordItems[target] ?? [],
        }],
      }],
    })
  }

  if (url.endsWith("/serp/google/organic/live/advanced")) {
    return jsonResponse({
      tasks: calls.at(-1).body.map((task) => ({
        status_code: 20000,
        data: task,
        result: [{
          keyword: task.keyword,
          items: serpItems[task.keyword] ?? [],
        }],
      })),
    })
  }

  if (url.endsWith("/backlinks/summary/live")) {
    const target = calls.at(-1).body[0].target
    return jsonResponse({
      status_code: 20000,
      status_message: "Ok.",
      cost: 0,
      tasks_count: 1,
      tasks_error: 0,
      tasks: [{
        status_code: 20000,
        status_message: "Ok.",
        result: [{
          target,
          referring_domains: target === "stripe.example" ? 1200 : target === "adyen.com" ? 2200 : 3100,
          referring_main_domains: target === "stripe.example" ? 1100 : target === "adyen.com" ? 2000 : 2900,
        }],
      }],
    })
  }

  throw new Error(`unexpected url ${url}`)
}

const rankedKeywordItems = {
  "stripe.example": [
    rankedKeyword("payments api pricing", 1200, 3),
    rankedKeyword("payment processing software", 800, 8),
  ],
  "adyen.com": [
    rankedKeyword("payments api pricing", 1200, 1),
    rankedKeyword("merchant account fees", 700, 4),
  ],
  "g2.com": [
    rankedKeyword("payment processing software", 800, 2),
  ],
}

const serpItems = {
  "payments api pricing": [
    serpItem("stripe.example", 3),
    serpItem("adyen.com", 1),
  ],
  "payment processing software": [
    serpItem("g2.com", 2),
    serpItem("stripe.example", 8),
  ],
  "merchant account fees": [
    serpItem("adyen.com", 4),
  ],
}

function serpItem(domain, rankGroup) {
  return {
    type: "organic",
    rank_group: rankGroup,
    rank_absolute: rankGroup,
    domain,
    url: `https://${domain}/page`,
  }
}

function rankedKeyword(keyword, searchVolume, rankGroup) {
  return {
    se_type: "google",
    keyword_data: {
      se_type: "google",
      keyword,
      location_code: 2840,
      language_code: "en",
      keyword_info: {
        search_volume: searchVolume,
      },
    },
    ranked_serp_element: {
      serp_item: {
        type: "organic",
        rank_group: rankGroup,
        rank_absolute: rankGroup,
        domain: "example.com",
        url: "https://example.com/page",
      },
    },
  }
}

function jsonResponse(payload) {
  return {
    ok: true,
    async json() {
      return payload
    },
  }
}

const {
  createHubblyIntelligenceClient,
} = loadTsModule("lib/audit/hubbly-intelligence.ts", fetchImpl)

const client = createHubblyIntelligenceClient({
  apiKey: "login:password",
  baseUrl: "https://example.test/v3",
  cadence: { free: "on_demand", autopilot: "weekly", workforce: "daily" },
})

client.fetchCompetitorSerpData({
  domain: "stripe.example",
  category: "payments API",
  buyerType: "business",
  businessModel: "b2b_saas",
  keywords: ["Payments API Pricing", "payment-processing software", "1/2 oz payment coin"],
}).then((competitors) => {
  assert.equal(JSON.stringify(competitors.competitors), JSON.stringify([
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
  ]))

  return client.fetchSerpPositions({
    domain: "stripe.example",
    category: "payments",
    buyerType: "business",
    businessModel: "b2b_saas",
    keywords: ["payments api pricing", "payment processing software", "merchant account fees"],
    competitorDomains: ["adyen.com", "g2.com"],
  })
}).then((positions) => {
  assert.equal(positions.domains.length, 3)
  assert.equal(positions.domains[0].domain, "stripe.example")
  assert.equal(JSON.stringify(positions.domains[1].keywords), JSON.stringify([
    { keyword: "payments api pricing", monthlyVolume: 1200, position: 1, provenance: "measured" },
    { keyword: "merchant account fees", monthlyVolume: 700, position: 4, provenance: "measured" },
  ]))

  return client.fetchBacklinkSummaries({
    domain: "stripe.example",
    category: "payments",
    buyerType: "business",
    businessModel: "b2b_saas",
    keywords: [],
    competitorDomains: ["adyen.com", "g2.com"],
  })
}).then((backlinks) => {
  assert.equal(JSON.stringify(backlinks.summaries), JSON.stringify([
    { domain: "stripe.example", referringDomains: 1200, referringMainDomains: 1100, provenance: "measured" },
    { domain: "adyen.com", referringDomains: 2200, referringMainDomains: 2000, provenance: "measured" },
    { domain: "g2.com", referringDomains: 3100, referringMainDomains: 2900, provenance: "measured" },
  ]))

  assert.equal(JSON.stringify(calls.map((call) => call.url)), JSON.stringify([
    `https://example.test/v3${labsPath}/competitors_domain/live`,
    `https://example.test/v3${labsPath}/ranked_keywords/live`,
    `https://example.test/v3${labsPath}/ranked_keywords/live`,
    `https://example.test/v3${labsPath}/ranked_keywords/live`,
    "https://example.test/v3/serp/google/organic/live/advanced",
    "https://example.test/v3/backlinks/summary/live",
    "https://example.test/v3/backlinks/summary/live",
    "https://example.test/v3/backlinks/summary/live",
  ]))
  assert.equal(calls[0].body[0].target, "stripe.example")
  assert.equal(calls[0].body[0].limit, 3)
  assert.equal(JSON.stringify(calls[0].body[0].exclude_domains), JSON.stringify(["stripe.example"]))
  assert.equal(calls[0].init.signal?.[Symbol.for("hubbly.timeoutMs")], 45000)
  assert.equal(calls[1].body[0].limit, 25)
  assert.equal(calls[1].init.signal?.[Symbol.for("hubbly.timeoutMs")], 60000)
  assert.equal(calls[4].init.signal?.[Symbol.for("hubbly.timeoutMs")], 90000)
  assert.equal(calls[5].init.signal?.[Symbol.for("hubbly.timeoutMs")], 45000)
  assert(calls[1].body[0].filters.flat(Infinity).includes("keyword_data.keyword_info.search_volume"))
  assert.equal(JSON.stringify(calls[4].body.map((task) => task.keyword)), JSON.stringify([
    "payments api pricing",
    "payment processing software",
    "merchant account fees",
  ]))

  console.log("hubbly intelligence competitive live adapter: 1 passed")
}).catch((error) => {
  console.error(error)
  process.exit(1)
})
