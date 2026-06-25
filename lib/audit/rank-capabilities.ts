export type AuditFeatureFlagName = "RANK_CONTENT_ENABLED" | "RANK_PUBLISH_ENABLED" | "BACKLINKS_ENABLED"

export type RankCapabilityTier = "tier_1" | "tier_2"

export type RankCapability = {
  id: string
  label: string
  description: string
  tier: RankCapabilityTier
  flag?: AuditFeatureFlagName
}

type EnvLike = Record<string, string | undefined>

export const RANK_TIER_1_CAPABILITIES: RankCapability[] = [
  {
    id: "rank.on_page_optimization",
    label: "On-page optimization",
    description: "Native on-page engine: meta, headers, and on-page content optimization.",
    tier: "tier_1",
  },
  {
    id: "rank.structured_data_schema",
    label: "Structured data schema",
    description: "JSON-LD schema graph and emit_schema.",
    tier: "tier_1",
  },
  {
    id: "rank.aeo_llms_txt",
    label: "AEO llms.txt",
    description: "llms.txt and AI-crawler policy for answer-engine visibility.",
    tier: "tier_1",
  },
  {
    id: "rank.instant_indexing",
    label: "Instant indexing",
    description: "IndexNow submission and instant index push.",
    tier: "tier_1",
  },
]

export const RANK_TIER_2_CAPABILITIES: RankCapability[] = [
  {
    id: "rank.content_generation",
    label: "Content generation",
    description: "Autonomous content pipeline.",
    tier: "tier_2",
    flag: "RANK_CONTENT_ENABLED",
  },
  {
    id: "rank.autonomous_publish",
    label: "Autonomous publishing",
    description: "Full publish round-trip.",
    tier: "tier_2",
    flag: "RANK_PUBLISH_ENABLED",
  },
]

export const RANK_CAPABILITIES = [
  ...RANK_TIER_1_CAPABILITIES,
  ...RANK_TIER_2_CAPABILITIES,
]

export function isAuditFeatureEnabled(flag: AuditFeatureFlagName, env: EnvLike = process.env) {
  const value = env[flag]
  if (!value) return false

  return /^(1|true|yes|on)$/i.test(value.trim())
}

export function enabledRankCapabilities(env: EnvLike = process.env) {
  return RANK_CAPABILITIES.filter((capability) => {
    if (capability.tier === "tier_1") return true
    return Boolean(capability.flag && isAuditFeatureEnabled(capability.flag, env))
  })
}

export function enabledRankCapabilityIds(env: EnvLike = process.env) {
  return new Set(enabledRankCapabilities(env).map((capability) => capability.id))
}

export function rankCapabilityById(id: string) {
  return RANK_CAPABILITIES.find((capability) => capability.id === id) ?? null
}

