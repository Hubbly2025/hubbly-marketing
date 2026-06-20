import type { Audit, SampleEmail } from "./types"

export const A16Z_WRONG_EMAIL_BODY =
  "Saw your team led the 'No Man Left Behind' piece on American tech values. We're building autonomous targeting systems that put US warfighters first while competitors focus on commercial applications. Our defense contracts are growing 40% MoM but we need strategic guidance navigating Pentagon procurement while scaling commercial dual-use. Would 15 minutes next week work to discuss if American Dynamism invests at our stage?"

export const A16Z_CORRECTED_EMAIL: Required<SampleEmail> = {
  subject: "American Dynamism + your defense AI momentum",
  body: "Noticed your team's defense AI work putting US warfighters first while competitors chase commercial applications. Your 40% MoM contract growth and Pentagon procurement focus aligns with American Dynamism's mandate - backing founders rebuilding America's defense industrial base. We've helped portfolio companies navigate DoD procurement while scaling dual-use commercial applications. Worth 15 minutes to explore if we're a fit for your next round?",
}

export function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

export function formatDate(value?: string) {
  if (!value) return new Date().toLocaleDateString()

  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

export function formatPlanValue(value: unknown): string {
  if (!value) return "Unavailable"

  if (typeof value === "string" || typeof value === "number") {
    return String(value)
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => `${key.replace(/_/g, " ")}: ${String(entry)}`)
      .join(" · ")
  }

  return String(value)
}

export function isAndreessenHorowitzReport(audit: Audit, companyName: string, domain: string) {
  const haystack = [
    audit.url,
    domain,
    companyName,
    audit.analysis?.company_name,
    audit.analysis?.product,
    audit.analysis?.industry,
    audit.analysis?.outreach_angle,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return (
    haystack.includes("andreessen") ||
    haystack.includes("a16z") ||
    haystack.includes("american dynamism")
  )
}

export function replacePlanEmailPov(plan: Audit["gtm_plan"]): Audit["gtm_plan"] {
  if (!plan) return plan

  return replaceNestedValue(plan) as Audit["gtm_plan"]
}

function replaceNestedValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(A16Z_WRONG_EMAIL_BODY, A16Z_CORRECTED_EMAIL.body)
  }

  if (Array.isArray(value)) {
    return value.map((entry) => replaceNestedValue(entry))
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        replaceNestedValue(entry),
      ]),
    )
  }

  return value
}
