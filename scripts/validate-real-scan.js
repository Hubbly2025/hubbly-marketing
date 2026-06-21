#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")
const vm = require("node:vm")

const STRIPE_URL = "https://stripe.com"
const JOES_URL = "https://www.joescrabshack.com/"
const EXPECTED_MODEL = "claude-opus-4-8"
const EXPECTED_MODEL_VERSION = "4.8"
const LABS_PATH = "/data" + "forseo_labs/google"
const VENDOR_NAME_PATTERN = new RegExp("Data" + "ForSEO|data" + "forseo", "i")

const ENDPOINTS = {
  searchVolume: "/keywords_data/google_ads/search_volume/live",
  competitorsDomain: `${LABS_PATH}/competitors_domain/live`,
  rankedKeywords: `${LABS_PATH}/ranked_keywords/live`,
  serpAdvanced: "/serp/google/organic/live/advanced",
  backlinksSummary: "/backlinks/summary/live",
}

function main() {
  runRealValidation().then((result) => {
    printChecks(result.checks)

    const passed = result.checks.filter((check) => check.pass).length
    const total = result.checks.length

    if (passed === total) {
      console.log(`REAL-KEY VALIDATION: PASS (${passed}/${total})`)
      return
    }

    console.error(`REAL-KEY VALIDATION: FAIL (${passed}/${total})`)
    console.error(`Failing checks: ${result.checks.filter((check) => !check.pass).map((check) => check.id).join(", ")}`)
    process.exit(1)
  }).catch((error) => {
    console.error("REAL-KEY VALIDATION: FAIL")
    console.error(error)
    process.exit(1)
  })
}

async function runRealValidation() {
  const capture = createFetchCapture()
  const restoreFetch = capture.install()

  try {
    process.env.SUPABASE_SERVICE_ROLE_KEY ||= "real-key-validation-local-capture"
    const { processAudit } = loadTsModule("lib/audit/process-audit.ts")
    const scans = {}

    for (const target of [
      { key: "stripe", url: STRIPE_URL },
      { key: "joes", url: JOES_URL },
    ]) {
      const auditId = `real-key-validation-${target.key}-${Date.now()}`
      capture.createAuditRow(auditId, target.url)
      await processAudit(auditId, target.url, {
        cacheDomain: normalizeDomain(target.url),
        cacheKey: `validation:bypass:${auditId}`,
        requestedAt: new Date().toISOString(),
        rateLimitKey: "validation-cache-bypass",
        cacheTtlSeconds: 0,
      })
      scans[target.key] = capture.getAuditRow(auditId)
    }

    return validateResults({
      scans,
      captures: capture.getCaptures(),
      renderedOutput: JSON.stringify(scans),
    })
  } finally {
    restoreFetch()
  }
}

function validateResults(input) {
  const checks = [
    checkSynthesis(input),
    checkVendorEndpointMapping(input),
    checkMeasuredStripeIntent(input),
    checkHighIntentSubset(input),
    checkObservedEvidence(input),
    checkProvenanceChips(input),
    checkBattlefieldDomains(input),
    checkVendorWalling(input),
  ]

  return { checks }
}

function checkSynthesis(input) {
  const stripe = input.scans.stripe ?? {}
  const joes = input.scans.joes ?? {}
  const stripeModel = modelProvenance(stripe)
  const joesModel = modelProvenance(joes)
  const anthropicCalls = input.captures.anthropic ?? []
  const fallbackReasons = [stripe, joes]
    .map((scan) => scan.analysis?.audit_debug?.manual_review?.reason)
    .filter(Boolean)

  return check(
    "Synthesis",
    anthropicCalls.length >= 2 &&
      stripeModel?.model === EXPECTED_MODEL &&
      stripeModel?.version === EXPECTED_MODEL_VERSION &&
      joesModel?.model === EXPECTED_MODEL &&
      joesModel?.version === EXPECTED_MODEL_VERSION &&
      fallbackReasons.length === 0,
    {
      anthropicCalls: anthropicCalls.length,
      stripeModel,
      joesModel,
      fallbackReasons,
    },
  )
}

function checkVendorEndpointMapping(input) {
  const stripe = input.scans.stripe ?? {}
  const intent = stripe.intent_data ?? {}
  const competitive = stripe.competitive_intelligence ?? {}
  const endpoints = input.captures.vendorEndpoints ?? []
  const byEndpoint = (suffix) => endpoints.filter((entry) => entry.url.endsWith(suffix))
  const searchItems = flatResultItems(byEndpoint(ENDPOINTS.searchVolume))
  const competitorItems = flatResultItems(byEndpoint(ENDPOINTS.competitorsDomain))
  const rankedItems = flatResultItems(byEndpoint(ENDPOINTS.rankedKeywords))
  const serpItems = flatResultItems(byEndpoint(ENDPOINTS.serpAdvanced))
  const backlinkItems = flatResultItems(byEndpoint(ENDPOINTS.backlinksSummary))
  const firstKeyword = intent.keyword_volumes?.[0] ?? {}
  const firstSearch = searchItems[0] ?? {}
  const firstCompetitor = competitorItems[0] ?? {}
  const firstRanked = rankedItems[0] ?? {}
  const firstSerp = serpItems.find((item) => typeof item.rank_absolute === "number") ?? {}
  const firstBacklink = backlinkItems[0] ?? {}
  const mappedRanked = competitive.battlefield?.[0] ?? competitive.marketplaces?.[0] ?? {}

  const value = {
    search_volume: {
      raw: firstSearch.search_volume ?? null,
      monthlyVolume: firstKeyword.monthlyVolume ?? null,
      competition: firstSearch.competition ?? null,
      competition_index: firstSearch.competition_index ?? null,
    },
    competitors_domain: {
      domain: firstCompetitor.domain ?? null,
      avg_position: firstCompetitor.avg_position ?? null,
      intersections: firstCompetitor.intersections ?? null,
    },
    ranked_keywords: {
      keyword: firstRanked.keyword_data?.keyword ?? null,
      position: firstRanked.ranked_serp_element?.serp_item?.rank_group ?? null,
      volume: firstRanked.keyword_data?.keyword_info?.search_volume ?? null,
    },
    serp_organic_advanced: {
      rank_absolute: firstSerp.rank_absolute ?? null,
    },
    backlinks_summary: {
      referring_domains: firstBacklink.referring_domains ?? mappedRanked.referringDomains ?? null,
    },
  }

  return check(
    "Endpoint mapping",
    byEndpoint(ENDPOINTS.searchVolume).length > 0 &&
      byEndpoint(ENDPOINTS.competitorsDomain).length > 0 &&
      byEndpoint(ENDPOINTS.rankedKeywords).length > 0 &&
      byEndpoint(ENDPOINTS.serpAdvanced).length > 0 &&
      byEndpoint(ENDPOINTS.backlinksSummary).length > 0 &&
      nonNull(value.search_volume.raw) &&
      nonNull(value.search_volume.monthlyVolume) &&
      nonNull(value.search_volume.competition) &&
      nonNull(value.search_volume.competition_index) &&
      nonNull(value.competitors_domain.domain) &&
      nonNull(value.competitors_domain.avg_position) &&
      nonNull(value.competitors_domain.intersections) &&
      nonNull(value.ranked_keywords.keyword) &&
      nonNull(value.ranked_keywords.position) &&
      nonNull(value.ranked_keywords.volume) &&
      nonNull(value.serp_organic_advanced.rank_absolute) &&
      nonNull(value.backlinks_summary.referring_domains),
    value,
  )
}

function checkMeasuredStripeIntent(input) {
  const intent = input.scans.stripe?.intent_data ?? {}

  return check(
    "Measured Stripe intent",
    intent.status === "measured" &&
      Number(intent.monthly) > 0 &&
      Array.isArray(intent.keyword_volumes) &&
      intent.keyword_volumes.length > 0 &&
      intent.provenance?.monthly === "measured" &&
      intent.provenance?.keyword_volumes === "measured",
    {
      status: intent.status,
      monthly: intent.monthly ?? null,
      keywordVolumes: intent.keyword_volumes?.slice(0, 3) ?? [],
      provenance: intent.provenance ?? null,
    },
  )
}

function checkHighIntentSubset(input) {
  const intent = input.scans.stripe?.intent_data ?? {}
  const monthly = Number(intent.monthly ?? 0)
  const highIntent = Number(intent.highIntent ?? intent.high_intent ?? 0)

  return check(
    "High-intent subset",
    monthly > 0 && highIntent > 0 && highIntent < monthly,
    { monthly, highIntent },
  )
}

function checkObservedEvidence(input) {
  const evidence = input.scans.stripe?.analysis?.site_profile?.observed_evidence ?? {}

  return check(
    "Observed evidence",
    nonEmptyString(evidence.h1) && nonEmptyString(evidence.primary_cta_text),
    {
      h1: evidence.h1 ?? null,
      primary_cta_text: evidence.primary_cta_text ?? null,
      key_headers: evidence.key_headers ?? [],
    },
  )
}

function checkProvenanceChips(input) {
  const stripe = input.scans.stripe ?? {}
  const intent = stripe.intent_data ?? {}
  const competitive = stripe.competitive_intelligence ?? {}
  const geoChip = Array.isArray(intent.geographies) && intent.geographies.length
    ? intent.provenance?.geographies
    : null

  return check(
    "Provenance chips",
    intent.provenance?.monthly === "measured" &&
      intent.provenance?.keyword_volumes === "measured" &&
      competitive.provenance?.competitor_domains === "measured" &&
      competitive.provenance?.battlefield === "measured" &&
      geoChip !== "estimated",
    {
      intentProvenance: intent.provenance ?? null,
      competitiveProvenance: competitive.provenance ?? null,
      geoCount: intent.geographies?.length ?? 0,
      renderedGeoChip: geoChip,
    },
  )
}

function checkBattlefieldDomains(input) {
  const competitive = input.scans.stripe?.competitive_intelligence ?? {}
  const rows = [
    ...(competitive.battlefield ?? []),
    ...(competitive.marketplaces ?? []),
  ]
  const guessed = rows.filter((row) => row.domain_source && row.domain_source !== "measured")

  return check(
    "Battlefield measured domains",
    rows.length > 0 &&
      rows.every((row) => nonEmptyString(row.domain) && row.provenance === "measured") &&
      competitive.provenance?.competitor_domains === "measured" &&
      guessed.length === 0,
    {
      rows: rows.map((row) => ({
        domain: row.domain ?? null,
        provenance: row.provenance ?? null,
        domain_source: row.domain_source ?? "measured",
      })),
      guessed,
    },
  )
}

function checkVendorWalling(input) {
  return check(
    "Vendor walling",
    !VENDOR_NAME_PATTERN.test(input.renderedOutput ?? ""),
    {
      containsVendorName: VENDOR_NAME_PATTERN.test(input.renderedOutput ?? ""),
    },
  )
}

function printChecks(checks) {
  checks.forEach((item, index) => {
    const status = item.pass ? "PASS" : "FAIL"
    console.log(`${index + 1}. ${item.name}: ${status} ${JSON.stringify(item.value)}`)
  })
}

function check(name, pass, value) {
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
    name,
    pass: Boolean(pass),
    value,
  }
}

function createFetchCapture() {
  const originalFetch = globalThis.fetch
  const auditRows = new Map()
  const captures = {
    anthropic: [],
    vendorEndpoints: [],
  }

  return {
    install() {
      globalThis.fetch = async (input, init) => {
        const url = typeof input === "string" ? input : input.url

        if (url.includes("/rest/v1/audit_leads")) {
          return handleSupabaseCapture(url, init, auditRows)
        }

        const response = await originalFetch(input, init)
        await captureResponse(url, init, response, captures)
        return response
      }

      return () => {
        globalThis.fetch = originalFetch
      }
    },
    createAuditRow(auditId, url) {
      auditRows.set(auditId, {
        id: auditId,
        url,
        status: "processing",
        created_at: new Date().toISOString(),
      })
    },
    getAuditRow(auditId) {
      return auditRows.get(auditId) ?? null
    },
    getCaptures() {
      return captures
    },
  }
}

function handleSupabaseCapture(url, init, auditRows) {
  const id = decodeURIComponent(url.match(/id=eq\.([^&]+)/)?.[1] ?? "")
  const body = init?.body ? JSON.parse(init.body) : {}
  const existing = auditRows.get(id) ?? { id }
  auditRows.set(id, {
    ...existing,
    ...body,
    id,
  })

  return new Response(JSON.stringify([]), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

async function captureResponse(url, init, response, captures) {
  const requestBody = parseRequestBody(init?.body)
  const status = response.status

  if (url.includes("api.anthropic.com/v1/messages")) {
    captures.anthropic.push({
      url,
      status,
      request: requestBody,
    })
    return
  }

  if (!isVendorEndpoint(url)) return

  let json = null
  try {
    json = await response.clone().json()
  } catch {
    json = null
  }

  captures.vendorEndpoints.push({
    url,
    status,
    ok: response.ok,
    request: requestBody,
    response: json,
  })
}

function isVendorEndpoint(url) {
  return Object.values(ENDPOINTS).some((suffix) => url.endsWith(suffix))
}

function parseRequestBody(body) {
  if (!body || typeof body !== "string") return null

  try {
    return JSON.parse(body)
  } catch {
    return body
  }
}

function flatResultItems(entries) {
  return entries.flatMap((entry) => {
    const tasks = entry.response?.tasks ?? []
    return tasks.flatMap((task) => {
      const results = task.result ?? []
      return results.flatMap((result) => result.items ?? [])
    })
  })
}

function modelProvenance(scan) {
  return scan.analysis?.model_provenance ??
    scan.analysis?.provenance?.model ??
    scan.analysis?.site_profile?.model_provenance ??
    scan.analysis?.site_profile?.provenance?.model ??
    null
}

function nonNull(value) {
  return value !== null && value !== undefined
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0
}

function normalizeDomain(url) {
  return new URL(url).hostname.toLowerCase().replace(/^www\./, "")
}

const moduleCache = new Map()

function loadTsModule(relativePath) {
  const absolutePath = path.join(process.cwd(), relativePath)
  if (moduleCache.has(absolutePath)) return moduleCache.get(absolutePath).exports

  const source = fs.readFileSync(absolutePath, "utf8")
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      resolveJsonModule: true,
    },
  }).outputText
  const module = { exports: {} }
  moduleCache.set(absolutePath, module)
  const sandbox = {
    exports: module.exports,
    module,
    require: (specifier) => {
      if (specifier.endsWith(".json")) {
        return require(path.join(path.dirname(absolutePath), specifier))
      }
      if (specifier.startsWith("./") && fs.existsSync(path.join(path.dirname(absolutePath), `${specifier}.ts`))) {
        return loadTsModule(path.relative(process.cwd(), path.join(path.dirname(absolutePath), `${specifier}.ts`)))
      }
      return require(specifier)
    },
    process,
    console,
    Buffer,
    URL,
    Response,
    fetch: globalThis.fetch,
    AbortSignal,
    setTimeout,
    clearTimeout,
  }
  vm.runInNewContext(compiled, sandbox, { filename: absolutePath })
  return module.exports
}

if (require.main === module) {
  main()
}

module.exports = {
  ENDPOINTS,
  validateResults,
  runRealValidation,
}
