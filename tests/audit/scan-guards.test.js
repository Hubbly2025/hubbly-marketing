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
    },
  }).outputText
  const sandbox = {
    exports: {},
    module: { exports: {} },
    require,
    process,
    console,
    URL,
    Date,
    Buffer,
    crypto: require("node:crypto"),
  }
  sandbox.exports = sandbox.module.exports
  vm.runInNewContext(compiled, sandbox, { filename: sourcePath })
  return sandbox.module.exports
}

const {
  normalizeAuditUrl,
  normalizeAuditDomain,
  prepareAuditScan,
  runGuardedAuditScanForTest,
} = loadTsModule("lib/audit/scan-guards.ts")

const now = new Date("2026-06-21T12:00:00.000Z")

assert.equal(normalizeAuditUrl(" WWW.Stripe.com/pricing/?utm=1#top "), "https://www.stripe.com/pricing")
assert.equal(normalizeAuditDomain("https://www.stripe.com/pricing"), "stripe.com")

function createMockStore({ cachedScan, recentRequests = 0 } = {}) {
  const calls = []
  return {
    calls,
    async getCachedScan(input) {
      calls.push(["getCachedScan", input])
      if (!cachedScan) return null
      const scannedAt = new Date(cachedScan.scannedAt)
      if (scannedAt < input.minCompletedAt) return null
      return cachedScan
    },
    async countRecentRequests(input) {
      calls.push(["countRecentRequests", input])
      return recentRequests
    },
    async createProcessingScan(input) {
      calls.push(["createProcessingScan", input])
      return { id: "fresh-audit" }
    },
  }
}

Promise.resolve().then(async () => {
  let vendorInvoked = false
  const hitStore = createMockStore({
    cachedScan: {
      id: "cached-audit",
      domain: "stripe.com",
      scannedAt: "2026-06-20T12:00:00.000Z",
      reportUrl: "/audit/report/cached-audit",
      payload: {
        status: "complete",
        analysis: {
          site_profile: {
            domain: "stripe.com",
            scanned_at: "2026-06-20T12:00:00.000Z",
            provenance: { domain: "measured" },
          },
        },
      },
    },
  })
  const hit = await runGuardedAuditScanForTest({
    rawUrl: "https://www.stripe.com/",
    requesterKey: "ip:1",
    now,
    store: hitStore,
    runFreshScan: async () => {
      vendorInvoked = true
    },
  })

  assert.equal(hit.status, "cache_hit")
  assert.equal(hit.auditId, "cached-audit")
  assert.equal(hit.scannedAt, "2026-06-20T12:00:00.000Z")
  assert.equal(vendorInvoked, false)
  assert.equal(hitStore.calls.some((call) => call[0] === "countRecentRequests"), false)

  const limitedStore = createMockStore({ recentRequests: 5 })
  const limited = await prepareAuditScan({
    rawUrl: "https://stripe.com",
    requesterKey: "ip:2",
    now,
    store: limitedStore,
    config: { cacheTtlSeconds: 604800, rateLimitMax: 5, rateLimitWindowSeconds: 3600 },
  })
  assert.equal(limited.status, "rate_limited")
  assert.equal(limited.retryAfterSeconds, 3600)
  assert.equal(limitedStore.calls.some((call) => call[0] === "createProcessingScan"), false)

  let freshRuns = 0
  const expiredStore = createMockStore({
    cachedScan: {
      id: "expired-audit",
      domain: "stripe.com",
      scannedAt: "2026-06-01T12:00:00.000Z",
      reportUrl: "/audit/report/expired-audit",
      payload: { status: "complete" },
    },
  })
  const expired = await runGuardedAuditScanForTest({
    rawUrl: "https://stripe.com",
    requesterKey: "ip:3",
    now,
    store: expiredStore,
    runFreshScan: async (auditId, normalizedUrl, metadata) => {
      freshRuns += 1
      assert.equal(auditId, "fresh-audit")
      assert.equal(normalizedUrl, "https://stripe.com")
      assert.equal(metadata.cacheDomain, "stripe.com")
    },
  })
  assert.equal(expired.status, "fresh_scan")
  assert.equal(freshRuns, 1)

  let insufficientFreshRuns = 0
  const insufficientStore = createMockStore({
    cachedScan: {
      id: "insufficient-audit",
      domain: "stripe.com",
      scannedAt: "2026-06-20T12:00:00.000Z",
      reportUrl: "/audit/report/insufficient-audit",
      payload: {
        status: "complete",
        intent_data: { status: "insufficient_signal" },
      },
    },
  })
  const insufficient = await runGuardedAuditScanForTest({
    rawUrl: "https://stripe.com",
    requesterKey: "ip:4",
    now,
    store: insufficientStore,
    runFreshScan: async () => {
      insufficientFreshRuns += 1
    },
  })
  assert.equal(insufficient.status, "fresh_scan")
  assert.equal(insufficientFreshRuns, 1)

  console.log("scan guards: 1 passed")
}).catch((error) => {
  console.error(error)
  process.exit(1)
})
