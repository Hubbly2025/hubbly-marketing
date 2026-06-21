import { getHubblyIntelligenceConfig, type HubblyIntelligenceConfig } from "./hubbly-intelligence-config"

export type HubblyIntelligenceKeyword = {
  keyword: string
  monthlyVolume: number | null
}

export type HubblyIntelligenceKeywordDemand = {
  keywords: HubblyIntelligenceKeyword[]
}

export type HubblyIntelligenceRequest = {
  domain: string
  category: string
  buyerType: string
  businessModel: string
}

export type HubblyIntelligenceSerpRequest = HubblyIntelligenceRequest & {
  keywords: string[]
}

export type HubblyIntelligenceClient = {
  fetchKeywordDemand(request: HubblyIntelligenceRequest): Promise<HubblyIntelligenceKeywordDemand>
  fetchSerpPositions(request: HubblyIntelligenceSerpRequest): Promise<unknown>
  fetchCompetitorSerpData(request: HubblyIntelligenceSerpRequest): Promise<unknown>
  fetchInterceptTerms(request: HubblyIntelligenceRequest): Promise<unknown>
}

class RemoteHubblyIntelligenceClient implements HubblyIntelligenceClient {
  constructor(private readonly config: HubblyIntelligenceConfig) {}

  async fetchKeywordDemand(request: HubblyIntelligenceRequest): Promise<HubblyIntelligenceKeywordDemand> {
    const response = await this.postJson("/keyword-demand", request)
    const keywords: Array<{ keyword?: unknown; monthlyVolume?: unknown }> = Array.isArray(response.keywords)
      ? response.keywords
      : []

    return {
      keywords: keywords
        .map((item) => ({
          keyword: typeof item.keyword === "string" ? item.keyword : "",
          monthlyVolume: typeof item.monthlyVolume === "number" ? item.monthlyVolume : null,
        }))
        .filter((item) => item.keyword),
    }
  }

  async fetchSerpPositions(request: HubblyIntelligenceSerpRequest): Promise<unknown> {
    return this.postJson("/serp-positions", request)
  }

  async fetchCompetitorSerpData(request: HubblyIntelligenceSerpRequest): Promise<unknown> {
    return this.postJson("/competitor-serp", request)
  }

  async fetchInterceptTerms(request: HubblyIntelligenceRequest): Promise<unknown> {
    return this.postJson("/intercept-terms", request)
  }

  private async postJson(path: string, payload: Record<string, unknown>) {
    if (!this.config.apiKey || !this.config.baseUrl) {
      return {}
    }

    const response = await fetch(`${this.config.baseUrl.replace(/\/$/, "")}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) {
      return {}
    }

    return await response.json()
  }
}

export function createHubblyIntelligenceClient(
  config: HubblyIntelligenceConfig = getHubblyIntelligenceConfig(),
): HubblyIntelligenceClient {
  return new RemoteHubblyIntelligenceClient(config)
}
