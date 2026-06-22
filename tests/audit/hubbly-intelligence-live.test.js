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
  return {
    ok: true,
    async json() {
      return {
        tasks: [
          {
            status_code: 20000,
            result: [
              {
                items: [
                  {
                    keyword: "Payments API Pricing",
                    search_volume: 1200,
                    competition: "HIGH",
                    location_code: 2840,
                    language_code: "en",
                  },
                  {
                    keyword: "1/2 oz payment coin",
                    search_volume: 50,
                    competition: "LOW",
                  },
                  {
                    keyword: "software for ops",
                    search_volume: 800,
                    competition_index: 64,
                  },
                ],
              },
            ],
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
    { keyword: "payments api pricing", monthlyVolume: 1200, competition: "HIGH" },
    { keyword: "1/2 oz payment coin", monthlyVolume: 50, competition: "LOW" },
    { keyword: "software for ops", monthlyVolume: 800, competition: "64" },
  ]))

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
  assert.equal(calls.length, 1)
  console.log("hubbly intelligence live adapter: 1 passed")
}).catch((error) => {
  console.error(error)
  process.exit(1)
})
