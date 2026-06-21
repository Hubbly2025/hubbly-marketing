export type ScanTier = "free" | "paid"

export type ScanModelConfig = {
  provider: "anthropic"
  model: string
  version: string
  tier: ScanTier
  flippable_to?: string
}

const OPUS_4_8_MODEL = "claude-opus-4-8"
const SONNET_4_6_MODEL = "claude-sonnet-4-6"

export const SCAN_MODEL_POLICY: Record<ScanTier, ScanModelConfig> = {
  free: {
    provider: "anthropic",
    model: process.env.HUBBLY_SCAN_FREE_MODEL || OPUS_4_8_MODEL,
    version: "4.8",
    tier: "free",
    flippable_to: SONNET_4_6_MODEL,
  },
  paid: {
    provider: "anthropic",
    model: process.env.HUBBLY_SCAN_PAID_MODEL || OPUS_4_8_MODEL,
    version: "4.8",
    tier: "paid",
  },
}

export function getScanModelConfig(tier: ScanTier = "free") {
  return SCAN_MODEL_POLICY[tier]
}
