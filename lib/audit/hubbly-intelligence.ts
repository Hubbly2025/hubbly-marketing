import { getHubblyIntelligenceConfig, type HubblyIntelligenceConfig } from "./hubbly-intelligence-config"
import siteProfileVocab from "./site-profile-vocab.v1.json"

export type HubblyIntelligenceKeyword = {
  keyword: string
  monthlyVolume: number | null
  competition?: string | null
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
    const auth = this.authHeader()
    if (!auth || !this.config.baseUrl) return { keywords: [] }

    const response = await this.postJson("/keywords_data/google_ads/search_volume/live", [
      {
        keywords: buildKeywordSeeds(request),
        location_name: "United States",
        language_name: "English",
      },
    ], auth)

    return { keywords: parseKeywordDemandResponse(response) }
  }

  async fetchSerpPositions(request: HubblyIntelligenceSerpRequest): Promise<unknown> {
    void request
    return {}
  }

  async fetchCompetitorSerpData(request: HubblyIntelligenceSerpRequest): Promise<unknown> {
    void request
    return {}
  }

  async fetchInterceptTerms(request: HubblyIntelligenceRequest): Promise<unknown> {
    void request
    return {}
  }

  private async postJson(path: string, payload: unknown, authorization: string) {
    const baseUrl = this.config.baseUrl
    if (!baseUrl) return {}

    const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
      method: "POST",
      headers: {
        authorization,
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

  private authHeader() {
    if (this.config.login && this.config.password) {
      return `Basic ${Buffer.from(`${this.config.login}:${this.config.password}`).toString("base64")}`
    }

    if (this.config.apiKey?.includes(":")) {
      return `Basic ${Buffer.from(this.config.apiKey).toString("base64")}`
    }

    return this.config.apiKey ? `Basic ${this.config.apiKey}` : null
  }
}

type DataForSeoResponse = {
  tasks?: Array<{
    result?: unknown[]
  }>
}

function buildKeywordSeeds(request: HubblyIntelligenceRequest) {
  const category = canonicalizeVocabValue("categories", request.category) ?? canonicalizeDisplayKeyword(request.category)
  const buyer = canonicalizeVocabValue("buyer_types", request.buyerType) ?? canonicalizeDisplayKeyword(request.buyerType)
  const businessModel = canonicalizeVocabValue("business_models", request.businessModel)
    ?? canonicalizeDisplayKeyword(request.businessModel)
  const seeds = [
    category,
    `${category} pricing`,
    `${category} software`,
    `${category} platform`,
    buyer === "business" ? `${category} for business` : `${category} near me`,
    businessModel.includes("saas") ? `${category} api` : `${category} services`,
  ]

  return uniqueStrings(seeds.map(canonicalizeDisplayKeyword)).slice(0, 25)
}

function parseKeywordDemandResponse(payload: unknown): HubblyIntelligenceKeyword[] {
  const tasks = (payload as DataForSeoResponse | null)?.tasks ?? []
  const keywords: HubblyIntelligenceKeyword[] = []

  for (const task of tasks) {
    for (const result of task.result ?? []) {
      const items = Array.isArray((result as { items?: unknown[] }).items)
        ? (result as { items?: unknown[] }).items ?? []
        : []

      for (const item of items) {
        const record = asRecord(item)
        const keyword = canonicalizeDisplayKeyword(stringValue(record?.keyword))
        if (!keyword) continue

        keywords.push({
          keyword,
          monthlyVolume: numberValue(record?.search_volume),
          competition: competitionValue(record?.competition ?? record?.competition_index),
        })
      }
    }
  }

  return keywords
}

function canonicalizeDisplayKeyword(value?: string | null) {
  return (value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/\b(\d+)\s*\/\s*(\d+)\b/g, "$1/$2")
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9\s/.'"-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function canonicalizeVocabValue(
  field: "business_models" | "buyer_types" | "categories",
  value?: string | null,
) {
  const normalized = normalizeVocabValue(value)
  if (!normalized) return null

  for (const entry of siteProfileVocab[field]) {
    if (normalizeVocabValue(entry.slug) === normalized) return entry.slug
    if (entry.aliases.some((alias) => normalizeVocabValue(alias) === normalized)) return entry.slug
  }

  return null
}

function normalizeVocabValue(value?: string | null) {
  return canonicalizeDisplayKeyword(value)
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? value as Record<string, unknown> : null
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : null
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function competitionValue(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim()
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  return null
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

export function createHubblyIntelligenceClient(
  config: HubblyIntelligenceConfig = getHubblyIntelligenceConfig(),
): HubblyIntelligenceClient {
  return new RemoteHubblyIntelligenceClient(config)
}
