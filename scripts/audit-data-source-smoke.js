#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("node:fs")
const path = require("node:path")

const PLACEHOLDER_PATTERNS = [
  /Captured from website CTA language during audit/i,
  /Public website signals reviewed during audit/i,
  /\bdefault pricing 2026\b/i,
  /\bbest default for growing teams\b/i,
  /Estimated based on Hubbly Data category benchmarks/i,
  /could not resolve buyer\/category/i,
]

const HARDCODED_GEO_REGIONS = ["California", "Texas", "Florida", "New York", "Illinois"]
const NUMERIC_INTENT_FIELDS = ["monthly", "weekly", "highIntent"]
const VALID_NUMERIC_PROVENANCE = new Set(["measured", "estimated"])

function main() {
  const fixturePaths = process.argv.slice(2)

  if (!fixturePaths.length) {
    console.error("usage: node scripts/audit-data-source-smoke.js <fixture.json> [...]")
    process.exit(2)
  }

  const failures = []

  for (const fixturePath of fixturePaths) {
    const absolutePath = path.resolve(fixturePath)
    const payload = JSON.parse(fs.readFileSync(absolutePath, "utf8"))
    failures.push(...validateAuditPayload(payload, absolutePath))
  }

  if (failures.length) {
    console.error(`audit data source smoke: FAIL (${failures.length})`)
    for (const failure of failures) {
      console.error(`- ${failure}`)
    }
    process.exit(1)
  }

  console.log(`audit data source smoke: PASS (${fixturePaths.length} fixture${fixturePaths.length === 1 ? "" : "s"})`)
}

function validateAuditPayload(payload, label) {
  const failures = []
  const serialized = JSON.stringify(payload)

  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(serialized)) {
      failures.push(`${label}: placeholder/fallback string matched ${pattern}`)
    }
  }

  const audit = payload.audit ?? payload
  const intent = audit.intent_data ?? {}
  const intentProvenance = intent.provenance ?? {}
  const analysis = audit.analysis ?? {}
  const siteProfile = analysis.site_profile ?? {}
  const siteProvenance = siteProfile.provenance ?? analysis.provenance ?? {}

  for (const field of NUMERIC_INTENT_FIELDS) {
    if (typeof intent[field] === "number" && intent[field] > 0 && !VALID_NUMERIC_PROVENANCE.has(intentProvenance[field])) {
      failures.push(`${label}: intent_data.${field} is numeric without measured/estimated provenance`)
    }
  }
  if (typeof intent.high_intent === "number" && intent.high_intent > 0 && !VALID_NUMERIC_PROVENANCE.has(intentProvenance.highIntent ?? intentProvenance.high_intent)) {
    failures.push(`${label}: intent_data.high_intent is numeric without measured/estimated provenance`)
  }

  const keywordVolumes = Array.isArray(intent.keyword_volumes) ? intent.keyword_volumes : []
  keywordVolumes.forEach((item, index) => {
    if (typeof item?.monthlyVolume === "number" && item.monthlyVolume > 0 && intentProvenance.keyword_volumes !== "measured") {
      failures.push(`${label}: keyword_volumes[${index}].monthlyVolume is numeric without measured keyword_volumes provenance`)
    }
  })

  if (intentProvenance.monthly === "measured" && Number(intent.monthly ?? 0) > 0 && !keywordVolumes.length) {
    failures.push(`${label}: intent_data.monthly is measured but has no measured keyword source`)
  }

  if (intentProvenance.highIntent === "measured" && Number(intent.highIntent ?? intent.high_intent ?? 0) > 0 && !keywordVolumes.length) {
    failures.push(`${label}: intent_data.highIntent is measured but has no measured keyword source`)
  }

  if (intentProvenance.top_signals === "measured" && Array.isArray(intent.top_signals) && intent.top_signals.length > 0 && !keywordVolumes.length) {
    failures.push(`${label}: top_signals are measured but have no measured keyword source`)
  }

  const geographies = Array.isArray(intent.geographies) ? intent.geographies : []
  const geoRegions = geographies.map((item) => item?.region).filter(Boolean)
  if (geoRegions.length >= HARDCODED_GEO_REGIONS.length && HARDCODED_GEO_REGIONS.every((region, index) => geoRegions[index] === region)) {
    failures.push(`${label}: hardcoded geo distribution detected`)
  }

  const observedEvidence = siteProfile.observed_evidence ?? {}
  const hasObservedValue = Boolean(
    observedEvidence.primary_cta_text ||
    observedEvidence.h1 ||
    observedEvidence.key_headers?.length ||
    observedEvidence.detected_tech_stack?.length,
  )
  if (siteProvenance.observed_evidence === "measured" && !hasObservedValue) {
    failures.push(`${label}: observed_evidence is measured but contains no page-sourced value`)
  }

  const modelProvenance = analysis.model_provenance ?? analysis.provenance?.model ?? siteProfile.model_provenance ?? siteProvenance.model
  if (!modelProvenance || !modelProvenance.model || !modelProvenance.version || !modelProvenance.tier) {
    failures.push(`${label}: missing synthesis model provenance with model/version/tier`)
  }

  return failures
}

if (require.main === module) {
  main()
}

module.exports = { validateAuditPayload }
