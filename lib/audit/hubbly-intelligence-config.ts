export type HubblyIntelligenceConfig = {
  apiKey?: string
  baseUrl?: string
  provider?: string
  cadence: {
    free: "on_demand"
    autopilot: "weekly"
    workforce: "daily"
  }
}

export function getHubblyIntelligenceConfig(): HubblyIntelligenceConfig {
  return {
    apiKey: process.env.HUBBLY_INTELLIGENCE_API_KEY,
    baseUrl: process.env.HUBBLY_INTELLIGENCE_BASE_URL,
    provider: process.env.HUBBLY_INTELLIGENCE_PROVIDER,
    cadence: {
      free: "on_demand",
      autopilot: "weekly",
      workforce: "daily",
    },
  }
}
