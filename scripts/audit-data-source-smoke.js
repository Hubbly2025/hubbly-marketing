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
  const competitive = audit.competitive_intelligence ?? {}
  const competitiveProvenance = competitive.provenance ?? {}
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

  failures.push(...validateCompetitiveIntelligence(competitive, competitiveProvenance, label))

  const modelProvenance = analysis.model_provenance ?? analysis.provenance?.model ?? siteProfile.model_provenance ?? siteProvenance.model
  if (!modelProvenance || !modelProvenance.model || !modelProvenance.version || !modelProvenance.tier) {
    failures.push(`${label}: missing synthesis model provenance with model/version/tier`)
  }

  return failures
}

function validateCompetitiveIntelligence(competitive, provenance, label) {
  const failures = []
  const battlefield = Array.isArray(competitive.battlefield) ? competitive.battlefield : []
  const marketplaces = Array.isArray(competitive.marketplaces) ? competitive.marketplaces : []
  const bleeding = Array.isArray(competitive.bleeding) ? competitive.bleeding : []
  const hasMeasuredCompetitiveClaim =
    competitive.status === "measured" ||
    battlefield.some((item) => item?.provenance === "measured") ||
    marketplaces.some((item) => item?.provenance === "measured") ||
    bleeding.some((item) => item?.provenance === "measured")

  if (hasMeasuredCompetitiveClaim && provenance.competitor_domains !== "measured") {
    failures.push(`${label}: measured competitive claim has no measured competitor-domain source`)
  }

  battlefield.forEach((item, index) => {
    if (item?.provenance !== "measured") return
    if (!item.domain) {
      failures.push(`${label}: battlefield[${index}] is measured but has no domain`)
    }
    if (item.domain_source && item.domain_source !== "measured") {
      failures.push(`${label}: battlefield[${index}] uses a non-measured domain source`)
    }
    if (typeof item.shareOfVoice === "number" && provenance.battlefield !== "measured") {
      failures.push(`${label}: battlefield[${index}].shareOfVoice is numeric without measured battlefield provenance`)
    }
    if (typeof item.referringDomains === "number" && provenance.backlinks !== "measured") {
      failures.push(`${label}: battlefield[${index}].referringDomains is numeric without measured backlink provenance`)
    }
  })

  marketplaces.forEach((item, index) => {
    if (item?.provenance !== "measured") return
    if (!item.domain) {
      failures.push(`${label}: marketplaces[${index}] is measured but has no domain`)
    }
    if (item.domain_source && item.domain_source !== "measured") {
      failures.push(`${label}: marketplaces[${index}] uses a non-measured domain source`)
    }
  })

  bleeding.forEach((item, index) => {
    if (item?.provenance !== "measured") return
    if (!Array.isArray(item.competitorDomains) || !item.competitorDomains.length) {
      failures.push(`${label}: bleeding[${index}] is measured but has no measured competitor domain`)
    }
    if (typeof item.monthlyVolume === "number" && item.monthlyVolume > 0 && provenance.bleeding !== "measured") {
      failures.push(`${label}: bleeding[${index}].monthlyVolume is numeric without measured bleeding provenance`)
    }
  })

  if (typeof competitive.bleedingMonthly === "number" && competitive.bleedingMonthly > 0 && provenance.bleeding !== "measured") {
    failures.push(`${label}: bleedingMonthly is numeric without measured bleeding provenance`)
  }

  return failures
}

if (require.main === module) {
  main()
}

module.exports = { validateAuditPayload }
