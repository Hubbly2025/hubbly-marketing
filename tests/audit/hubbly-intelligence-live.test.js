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
const fetchImpl = async (url, init) => {
  calls.push({ url, init })
  const requestBody = JSON.parse(init.body)
  const requestedKeywords = requestBody[0]?.keywords ?? []
  return {
    ok: true,
    async json() {
      return {
        status_code: 20000,
        status_message: "Ok.",
        cost: 0.075,
        tasks_count: 1,
        tasks_error: 0,
        tasks: [
          {
            status_code: 20000,
            status_message: "Ok.",
            cost: 0.075,
            result_count: 3,
            result: keywordRowsForRequest(requestedKeywords),
          },
        ],
      }
    },
  }
}

const {
  createHubblyIntelligenceClient,
} = loadTsModule("lib/audit/hubbly-intelligence.ts", fetchImpl)

createHubblyIntelligenceClient({
  apiKey: "login:password",
  baseUrl: "https://example.test/v3",
  cadence: { free: "on_demand", autopilot: "weekly", workforce: "daily" },
}).fetchKeywordDemand({
  domain: "stripe.example",
  category: "payments API",
  buyerType: "business",
  businessModel: "b2b_saas",
}).then((demand) => {
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, "https://example.test/v3/keywords_data/google_ads/search_volume/live")
  assert.equal(calls[0].init.method, "POST")
  assert.equal(calls[0].init.headers.authorization, `Basic ${Buffer.from("login:password").toString("base64")}`)
  assert.equal(calls[0].init.signal?.[Symbol.for("hubbly.timeoutMs")], 20000)

  const body = JSON.parse(calls[0].init.body)
  assert.equal(body[0].location_name, "United States")
  assert.equal(body[0].language_name, "English")
  assert.deepEqual(body[0].keywords, [
    "payments",
    "payments pricing",
    "payments software",
    "payments platform",
    "payments for business",
    "payments api",
  ])

  assert.equal(JSON.stringify(demand.keywords), JSON.stringify([
    { keyword: "payments", monthlyVolume: 1000, competition: "HIGH" },
    { keyword: "payments pricing", monthlyVolume: 900, competition: "81" },
    { keyword: "payments api", monthlyVolume: 700, competition: "64" },
  ]))

  return createHubblyIntelligenceClient({
    apiKey: "login:password",
    baseUrl: "https://example.test/v3",
    cadence: { free: "on_demand", autopilot: "weekly", workforce: "daily" },
  }).fetchKeywordDemand({
    domain: "joes.example",
    category: "seafood_restaurant",
    buyerType: "consumer",
    businessModel: "local_service",
  })
}).then((restaurantDemand) => {
  assert.equal(JSON.stringify(restaurantDemand.keywords), JSON.stringify([
    { keyword: "seafood restaurant", monthlyVolume: 1100, competition: "MEDIUM" },
    { keyword: "seafood restaurant near me", monthlyVolume: 950, competition: "HIGH" },
  ]))
  assert(!restaurantDemand.keywords.some((item) => item.keyword.includes("payments")))

  return createHubblyIntelligenceClient({
    cadence: { free: "on_demand", autopilot: "weekly", workforce: "daily" },
  }).fetchKeywordDemand({
    domain: "empty.example",
    category: "payments",
    buyerType: "business",
    businessModel: "b2b_saas",
  })
}).then((emptyDemand) => {
  assert.equal(JSON.stringify(emptyDemand.keywords), "[]")
  assert.equal(calls.length, 2)
  console.log("hubbly intelligence live adapter: 1 passed")
}).catch((error) => {
  console.error(error)
  process.exit(1)
})

function keywordRowsForRequest(requestedKeywords) {
  const requested = new Set(requestedKeywords)
  const rows = [
    keywordRow("payments", 1000, "HIGH"),
    keywordRow("payments pricing", 900, 81),
    keywordRow("payments api", 700, 64),
    keywordRow("seafood restaurant", 1100, "MEDIUM"),
    keywordRow("seafood restaurant near me", 950, "HIGH"),
    keywordRow("0 apr business loan", 500, "HIGH"),
  ]

  if (requested.has("payments")) {
    return rows
  }

  if (requested.has("seafood restaurant")) {
    return [
      keywordRow("seafood restaurant", 1100, "MEDIUM"),
      keywordRow("seafood restaurant near me", 950, "HIGH"),
      keywordRow("payments", 1000, "HIGH"),
    ]
  }

  return []
}

function keywordRow(keyword, searchVolume, competition) {
  return {
    keyword,
    search_volume: searchVolume,
    competition,
    competition_index: typeof competition === "number" ? competition : undefined,
    location_code: 2840,
    language_code: "en",
  }
}
