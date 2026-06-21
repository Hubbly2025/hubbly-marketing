import { createHash } from "node:crypto"

const DEFAULT_SUPABASE_URL = "https://fqsnvqkorwiwclbkscuj.supabase.co"
const DEFAULT_CACHE_TTL_SECONDS = 7 * 24 * 60 * 60
const DEFAULT_RATE_LIMIT_MAX = 5
const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 60 * 60

export type ScanGuardConfig = {
  cacheTtlSeconds: number
  rateLimitMax: number
  rateLimitWindowSeconds: number
}

export type ScanGuardMetadata = {
  cacheDomain: string
  cacheKey: string
  requestedAt: string
  rateLimitKey: string
  cacheTtlSeconds: number
}

export type CachedScan = {
  id: string
  domain: string
  scannedAt: string
  reportUrl: string
  payload?: Record<string, unknown>
}

export type ScanGuardStore = {
  getCachedScan(input: {
    domain: string
    minCompletedAt: Date
  }): Promise<CachedScan | null>
  countRecentRequests(input: {
    rateLimitKey: string
    since: Date
  }): Promise<number>
  createProcessingScan(input: {
    normalizedUrl: string
    domain: string
    metadata: ScanGuardMetadata
  }): Promise<{ id: string }>
}

export type PreparedAuditScan =
  | {
    status: "cache_hit"
    auditId: string
    domain: string
    normalizedUrl: string
    reportUrl: string
    scannedAt: string
    cache: {
      status: "hit"
      scanned_at: string
      domain: string
      expires_at: string
    }
  }
  | {
    status: "rate_limited"
    domain: string
    normalizedUrl: string
    retryAfterSeconds: number
    resetAt: string
    message: string
  }
  | {
    status: "fresh_scan"
    auditId: string
    domain: string
    normalizedUrl: string
    metadata: ScanGuardMetadata
  }

export function normalizeAuditUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Enter a website URL.")
  }

  const trimmed = value.trim()
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  const parsed = new URL(withProtocol)

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Enter a valid website URL.")
  }

  parsed.hash = ""
  parsed.search = ""
  parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/"

  return parsed.toString().replace(/\/$/, "")
}

export function normalizeAuditDomain(value: string) {
  const parsed = new URL(value)
  return parsed.hostname.toLowerCase().replace(/^www\./, "")
}

export function getScanGuardConfig(env: NodeJS.ProcessEnv = process.env): ScanGuardConfig {
  return {
    cacheTtlSeconds: positiveInt(env.AUDIT_SCAN_CACHE_TTL_SECONDS, DEFAULT_CACHE_TTL_SECONDS),
    rateLimitMax: positiveInt(env.AUDIT_RATE_LIMIT_SCANS_PER_HOUR, DEFAULT_RATE_LIMIT_MAX),
    rateLimitWindowSeconds: positiveInt(env.AUDIT_RATE_LIMIT_WINDOW_SECONDS, DEFAULT_RATE_LIMIT_WINDOW_SECONDS),
  }
}

export function getRequesterKey(request: Request, env: NodeJS.ProcessEnv = process.env) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const ip = request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-real-ip")
    ?? forwardedFor
    ?? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown"
  const session = request.headers.get("x-hubbly-session") ?? ""
  const salt = env.AUDIT_RATE_LIMIT_SALT || env.SUPABASE_SERVICE_ROLE_KEY || "hubbly-public-scan"

  return createHash("sha256")
    .update(`${salt}:${ip}:${session}`)
    .digest("hex")
}

export async function prepareAuditScan(params: {
  rawUrl: unknown
  requesterKey: string
  now?: Date
  store: ScanGuardStore
  config?: ScanGuardConfig
}): Promise<PreparedAuditScan> {
  const now = params.now ?? new Date()
  const config = params.config ?? getScanGuardConfig()
  const normalizedUrl = normalizeAuditUrl(params.rawUrl)
  const domain = normalizeAuditDomain(normalizedUrl)
  const cacheKey = `audit:domain:${domain}`
  const minCompletedAt = new Date(now.getTime() - config.cacheTtlSeconds * 1000)
  const cachedScan = await params.store.getCachedScan({ domain, minCompletedAt })

  if (cachedScan && isCacheableScanPayload(cachedScan.payload)) {
    const scannedAt = cachedScan.scannedAt
    return {
      status: "cache_hit",
      auditId: cachedScan.id,
      domain,
      normalizedUrl,
      reportUrl: cachedScan.reportUrl,
      scannedAt,
      cache: {
        status: "hit",
        scanned_at: scannedAt,
        domain,
        expires_at: new Date(new Date(scannedAt).getTime() + config.cacheTtlSeconds * 1000).toISOString(),
      },
    }
  }

  const since = new Date(now.getTime() - config.rateLimitWindowSeconds * 1000)
  const recentRequests = await params.store.countRecentRequests({
    rateLimitKey: params.requesterKey,
    since,
  })

  if (recentRequests >= config.rateLimitMax) {
    const resetAt = new Date(now.getTime() + config.rateLimitWindowSeconds * 1000)
    return {
      status: "rate_limited",
      domain,
      normalizedUrl,
      retryAfterSeconds: config.rateLimitWindowSeconds,
      resetAt: resetAt.toISOString(),
      message: `You've reached the public scan limit. Please try again after ${resetAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.`,
    }
  }

  const metadata: ScanGuardMetadata = {
    cacheDomain: domain,
    cacheKey,
    requestedAt: now.toISOString(),
    rateLimitKey: params.requesterKey,
    cacheTtlSeconds: config.cacheTtlSeconds,
  }
  const created = await params.store.createProcessingScan({
    normalizedUrl,
    domain,
    metadata,
  })

  return {
    status: "fresh_scan",
    auditId: created.id,
    domain,
    normalizedUrl,
    metadata,
  }
}

export async function runGuardedAuditScanForTest(params: {
  rawUrl: unknown
  requesterKey: string
  now?: Date
  store: ScanGuardStore
  config?: ScanGuardConfig
  runFreshScan(auditId: string, normalizedUrl: string, metadata: ScanGuardMetadata): Promise<void>
}) {
  const prepared = await prepareAuditScan(params)

  if (prepared.status === "fresh_scan") {
    await params.runFreshScan(prepared.auditId, prepared.normalizedUrl, prepared.metadata)
  }

  return prepared
}

export function createSupabaseScanGuardStore(params: {
  url?: string
  serviceRoleKey?: string
  fetchImpl?: typeof fetch
} = {}): ScanGuardStore {
  const url = params.url ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? DEFAULT_SUPABASE_URL
  const serviceRoleKey = params.serviceRoleKey ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  const fetchImpl = params.fetchImpl ?? fetch

  if (!serviceRoleKey) {
    throw new Error("Audit service is not configured yet.")
  }

  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  }

  return {
    async getCachedScan(input) {
      const query = new URLSearchParams({
        select: "id,url,status,created_at,completed_at,error_message,analysis,competitors,intent_data,competitive_intelligence,gtm_plan,sample_email",
        status: "eq.complete",
        error_message: "is.null",
        completed_at: `gte.${input.minCompletedAt.toISOString()}`,
        "analysis->site_profile->>domain": `eq.${input.domain}`,
        order: "completed_at.desc",
        limit: "1",
      })
      const response = await fetchImpl(`${url}/rest/v1/audit_leads?${query.toString()}`, {
        headers,
        cache: "no-store",
      })

      if (!response.ok) return null

      const rows = await response.json() as Array<Record<string, unknown>>
      const row = rows.find(isCacheableAuditRow)
      if (!row) return null

      const analysis = asRecord(row.analysis)
      const siteProfile = asRecord(analysis?.site_profile)
      const scannedAt = stringValue(siteProfile?.scanned_at) ?? stringValue(row.completed_at) ?? stringValue(row.created_at)
      const id = stringValue(row.id)

      if (!id || !scannedAt) return null

      return {
        id,
        domain: input.domain,
        scannedAt,
        reportUrl: `/audit/report/${id}`,
        payload: row,
      }
    },
    async countRecentRequests(input) {
      const query = new URLSearchParams({
        select: "id",
        created_at: `gte.${input.since.toISOString()}`,
        "analysis->scan_guard->>rate_limit_key": `eq.${input.rateLimitKey}`,
      })
      const response = await fetchImpl(`${url}/rest/v1/audit_leads?${query.toString()}`, {
        headers,
        cache: "no-store",
      })

      if (!response.ok) return 0

      const rows = await response.json() as unknown[]
      return Array.isArray(rows) ? rows.length : 0
    },
    async createProcessingScan(input) {
      const response = await fetchImpl(`${url}/rest/v1/audit_leads?select=id`, {
        method: "POST",
        headers: {
          ...headers,
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          url: input.normalizedUrl,
          status: "processing",
          analysis: {
            scan_guard: {
              domain: input.domain,
              cache_key: input.metadata.cacheKey,
              cache_ttl_seconds: input.metadata.cacheTtlSeconds,
              requested_at: input.metadata.requestedAt,
              rate_limit_key: input.metadata.rateLimitKey,
            },
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Could not start the audit: ${response.status} ${await response.text()}`)
      }

      const rows = await response.json() as Array<{ id?: string }>
      const id = rows[0]?.id
      if (!id) throw new Error("Audit started without an ID.")

      return { id }
    },
  }
}

function isCacheableAuditRow(row: Record<string, unknown>) {
  if (row.status !== "complete") return false
  if (row.error_message) return false
  if (!row.completed_at) return false

  const analysis = asRecord(row.analysis)
  if (!analysis || analysis.error) return false
  if (!asRecord(analysis.site_profile)) return false
  if (!isCacheableScanPayload(row)) return false

  return true
}

function isCacheableScanPayload(payload?: Record<string, unknown>) {
  if (!payload) return true

  if (payload.status && payload.status !== "complete") return false
  if (payload.error_message) return false

  const analysis = asRecord(payload.analysis)
  if (analysis?.error) return false

  const intentData = asRecord(payload.intent_data)
  if (intentData?.status === "insufficient_signal") return false

  return true
}

function positiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? value as Record<string, unknown> : null
}

function stringValue(value: unknown) {
  return typeof value === "string" && value ? value : null
}
