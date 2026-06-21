export type HubblyIntelligenceConfig = {
  apiKey?: string
  baseUrl?: string
  provider?: string
  login?: string
  password?: string
  cadence: {
    free: "on_demand"
    autopilot: "weekly"
    workforce: "daily"
  }
}

export function getHubblyIntelligenceConfig(): HubblyIntelligenceConfig {
  return {
    apiKey: process.env.HUBBLY_INTELLIGENCE_API_KEY,
    baseUrl: process.env.HUBBLY_INTELLIGENCE_BASE_URL || "https://api.dataforseo.com/v3",
    provider: process.env.HUBBLY_INTELLIGENCE_PROVIDER,
    login: process.env.HUBBLY_INTELLIGENCE_LOGIN || process.env.DATAFORSEO_LOGIN,
    password: process.env.HUBBLY_INTELLIGENCE_PASSWORD || process.env.DATAFORSEO_PASSWORD,
    cadence: {
      free: "on_demand",
      autopilot: "weekly",
      workforce: "daily",
    },
  }
}
