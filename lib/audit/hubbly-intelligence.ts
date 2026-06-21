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
  competitorDomains?: string[]
}

export type HubblyIntelligenceCompetitorDomain = {
  domain: string
  kind: "strategic_competitor" | "marketplace"
  label: string
  intersections: number | null
  avgPosition: number | null
  targetTraffic: number | null
  competitorTraffic: number | null
  provenance: "measured"
}

export type HubblyIntelligenceRankedKeyword = {
  keyword: string
  monthlyVolume: number | null
  position: number | null
  provenance: "measured"
}

export type HubblyIntelligenceDomainPositions = {
  domain: string
  keywords: HubblyIntelligenceRankedKeyword[]
  provenance: "measured"
}

export type HubblyIntelligenceBacklinkSummary = {
  domain: string
  referringDomains: number | null
  referringMainDomains: number | null
  provenance: "measured"
}

export type HubblyIntelligenceClient = {
  fetchKeywordDemand(request: HubblyIntelligenceRequest): Promise<HubblyIntelligenceKeywordDemand>
  fetchSerpPositions(request: HubblyIntelligenceSerpRequest): Promise<{ domains: HubblyIntelligenceDomainPositions[] }>
  fetchCompetitorSerpData(request: HubblyIntelligenceSerpRequest): Promise<{ competitors: HubblyIntelligenceCompetitorDomain[] }>
  fetchBacklinkSummaries(request: HubblyIntelligenceSerpRequest): Promise<{ summaries: HubblyIntelligenceBacklinkSummary[] }>
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

  async fetchSerpPositions(request: HubblyIntelligenceSerpRequest): Promise<{ domains: HubblyIntelligenceDomainPositions[] }> {
    const auth = this.authHeader()
    if (!auth || !this.config.baseUrl) return { domains: [] }

    const domains = uniqueStrings([request.domain, ...(request.competitorDomains ?? [])].map(normalizeDomain)).slice(0, 4)
    const rankedResponses = await Promise.all(domains.map(async (domain) => {
      const payload = await this.postJson("/dataforseo_labs/google/ranked_keywords/live", [
        {
          target: domain,
          location_name: "United States",
          language_name: "English",
          filters: [
            ["keyword_data.keyword_info.search_volume", "<>", 0],
            "and",
            [
              ["ranked_serp_element.serp_item.type", "<>", "paid"],
              "or",
              ["ranked_serp_element.serp_item.is_paid", "=", false],
            ],
          ],
          order_by: ["ranked_serp_element.serp_item.rank_group,asc"],
          limit: 25,
        },
      ], auth)

      return {
        domain,
        keywords: parseRankedKeywordsResponse(payload, request.keywords),
        provenance: "measured" as const,
      }
    }))

    const serpPayload = request.keywords.length
      ? await this.postJson("/serp/google/organic/live/advanced", request.keywords.slice(0, 5).map((keyword) => ({
        keyword: canonicalizeDisplayKeyword(keyword),
        location_name: "United States",
        language_name: "English",
        depth: 20,
      })), auth)
      : {}
    const exactPositions = parseSerpAdvancedResponse(serpPayload, domains, rankedResponses)

    return { domains: mergeExactPositions(rankedResponses, exactPositions) }
  }

  async fetchCompetitorSerpData(request: HubblyIntelligenceSerpRequest): Promise<{ competitors: HubblyIntelligenceCompetitorDomain[] }> {
    const auth = this.authHeader()
    if (!auth || !this.config.baseUrl) return { competitors: [] }

    const target = normalizeDomain(request.domain)
    if (!target) return { competitors: [] }

    const response = await this.postJson("/dataforseo_labs/google/competitors_domain/live", [
      {
        target,
        location_name: "United States",
        language_name: "English",
        limit: 3,
        exclude_domains: [target],
        item_types: ["organic"],
      },
    ], auth)

    return { competitors: parseCompetitorsDomainResponse(response, target).slice(0, 3) }
  }

  async fetchBacklinkSummaries(request: HubblyIntelligenceSerpRequest): Promise<{ summaries: HubblyIntelligenceBacklinkSummary[] }> {
    const auth = this.authHeader()
    if (!auth || !this.config.baseUrl) return { summaries: [] }

    const domains = uniqueStrings([request.domain, ...(request.competitorDomains ?? [])].map(normalizeDomain)).slice(0, 4)
    const summaries = await Promise.all(domains.map(async (domain) => {
      const payload = await this.postJson("/backlinks/summary/live", [
        {
          target: domain,
          internal_list_limit: 10,
          backlinks_status_type: "live",
        },
      ], auth)

      return parseBacklinkSummaryResponse(payload, domain)
    }))

    return { summaries }
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
    data?: unknown
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

function parseCompetitorsDomainResponse(payload: unknown, targetDomain: string): HubblyIntelligenceCompetitorDomain[] {
  return resultItems(payload)
    .map((item) => {
      const record = asRecord(item)
      const domain = normalizeDomain(stringValue(record?.domain))
      if (!domain || domain === targetDomain) return null
      const kind = isMarketplaceDomain(domain) ? "marketplace" : "strategic_competitor"

      return {
        domain,
        kind,
        label: kind === "marketplace" ? "marketplace ranking above you" : "competitor domain",
        intersections: numberValue(record?.intersections),
        avgPosition: numberValue(record?.avg_position),
        targetTraffic: organicTrafficValue(record?.metrics),
        competitorTraffic: organicTrafficValue(record?.competitor_metrics),
        provenance: "measured" as const,
      }
    })
    .filter((item): item is HubblyIntelligenceCompetitorDomain => Boolean(item))
}

function parseRankedKeywordsResponse(payload: unknown, priorityKeywords: string[]): HubblyIntelligenceRankedKeyword[] {
  const prioritySet = new Set(priorityKeywords.map(canonicalizeDisplayKeyword).filter(Boolean))

  return resultItems(payload)
    .map((item) => {
      const record = asRecord(item)
      const keywordData = asRecord(record?.keyword_data)
      const serpElement = asRecord(record?.ranked_serp_element)
      const serpItem = asRecord(serpElement?.serp_item)
      const keyword = canonicalizeDisplayKeyword(stringValue(keywordData?.keyword))
      if (!keyword || (prioritySet.size > 0 && !prioritySet.has(keyword))) return null

      return {
        keyword,
        monthlyVolume: numberValue(asRecord(keywordData?.keyword_info)?.search_volume),
        position: numberValue(serpItem?.rank_group ?? serpItem?.rank_absolute),
        provenance: "measured" as const,
      }
    })
    .filter((item): item is HubblyIntelligenceRankedKeyword => Boolean(item))
}

function parseSerpAdvancedResponse(
  payload: unknown,
  domains: string[],
  rankedResponses: HubblyIntelligenceDomainPositions[],
): HubblyIntelligenceDomainPositions[] {
  const domainSet = new Set(domains)
  const volumeByKeyword = new Map<string, number | null>()
  for (const domain of rankedResponses) {
    for (const item of domain.keywords) {
      if (!volumeByKeyword.has(item.keyword) || volumeByKeyword.get(item.keyword) === null) {
        volumeByKeyword.set(item.keyword, item.monthlyVolume)
      }
    }
  }

  const byDomain = new Map<string, HubblyIntelligenceRankedKeyword[]>()
  const tasks = (payload as DataForSeoResponse | null)?.tasks ?? []

  for (const task of tasks) {
    for (const result of task.result ?? []) {
      const resultRecord = asRecord(result)
      const keyword = canonicalizeDisplayKeyword(stringValue(resultRecord?.keyword) ?? stringValue(asRecord(task.data)?.keyword))
      if (!keyword || !Array.isArray(resultRecord?.items)) continue

      for (const item of resultRecord.items) {
        const record = asRecord(item)
        if (record?.type !== "organic") continue
        const domain = normalizeDomain(stringValue(record?.domain))
        if (!domainSet.has(domain)) continue
        const entries = byDomain.get(domain) ?? []
        entries.push({
          keyword,
          monthlyVolume: volumeByKeyword.get(keyword) ?? null,
          position: numberValue(record?.rank_group ?? record?.rank_absolute),
          provenance: "measured",
        })
        byDomain.set(domain, entries)
      }
    }
  }

  return Array.from(byDomain.entries()).map(([domain, keywords]) => ({
    domain,
    keywords,
    provenance: "measured",
  }))
}

function mergeExactPositions(
  rankedResponses: HubblyIntelligenceDomainPositions[],
  exactResponses: HubblyIntelligenceDomainPositions[],
) {
  const exactByDomain = new Map(exactResponses.map((item) => [item.domain, item]))

  return rankedResponses.map((ranked) => {
    const exact = exactByDomain.get(ranked.domain)
    if (!exact) return ranked
    const byKeyword = new Map(ranked.keywords.map((item) => [item.keyword, item]))
    for (const item of exact.keywords) {
      byKeyword.set(item.keyword, {
        ...byKeyword.get(item.keyword),
        ...item,
        monthlyVolume: item.monthlyVolume ?? byKeyword.get(item.keyword)?.monthlyVolume ?? null,
      })
    }

    return {
      ...ranked,
      keywords: Array.from(byKeyword.values()),
    }
  })
}

function parseBacklinkSummaryResponse(payload: unknown, domain: string): HubblyIntelligenceBacklinkSummary {
  const record = asRecord(resultItems(payload)[0])

  return {
    domain,
    referringDomains: numberValue(record?.referring_domains),
    referringMainDomains: numberValue(record?.referring_main_domains),
    provenance: "measured",
  }
}

function resultItems(payload: unknown) {
  const tasks = (payload as DataForSeoResponse | null)?.tasks ?? []
  const items: unknown[] = []

  for (const task of tasks) {
    for (const result of task.result ?? []) {
      const resultRecord = asRecord(result)
      if (Array.isArray(resultRecord?.items)) {
        items.push(...resultRecord.items)
      }
    }
  }

  return items
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

function normalizeDomain(value?: string | null) {
  const raw = (value ?? "").trim().toLowerCase()
  if (!raw) return ""

  try {
    return new URL(raw.includes("://") ? raw : `https://${raw}`).hostname.replace(/^www\./, "")
  } catch {
    return raw.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].trim()
  }
}

function organicTrafficValue(value: unknown) {
  return numberValue(asRecord(asRecord(value)?.organic)?.etv)
}

function isMarketplaceDomain(domain: string) {
  return /(^|\.)((g2|capterra|getapp|softwareadvice|trustradius|yelp|tripadvisor|opentable|doordash|ubereats|grubhub|amazon|walmart|reddit|youtube|facebook|instagram|linkedin|wikipedia)\.com|wikipedia\.org)$/.test(domain)
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
