// Click-ID capture (Part 2 of the won-event/click-id spec).
//
// Scope of THIS module: the capture layer only. On landing we read `fbclid`
// (Meta) and `gclid` (Google) from the URL and persist each as {id, captured_at}
// in a first-party cookie, with a localStorage mirror as a fallback. Retention
// is 90 days. The timestamp is first-click-wins: captured_at is set once, on the
// first touch, and never overwritten; only the ID itself is refreshed if a later
// visit carries a different value for the same param.
//
// NOT in this module (deferred — see PR body): attaching these values as hidden
// fields on lead-form submits, and persisting them onto the OS lead record. Those
// depend on the api-server "Part 1" lead schema, which does not exist yet, so the
// field names cannot be coordinated against it today. This module deliberately
// exposes getStoredClickIds() so that attach step becomes a thin consumer.
//
// CONSENT (D0 gate — OPEN): there is currently no consent tooling on the site.
// hasClickIdConsent() is the single seam where a consent check must be wired once
// that tooling lands. It defaults to allow today; see the PR body for the open
// decision. Do not scatter consent logic elsewhere — gate here.

export type ClickIdParam = "fbclid" | "gclid"

export interface ClickIdRecord {
  /** The raw click identifier (latest value seen for this param). */
  id: string
  /** ISO-8601 timestamp of the FIRST time this param was captured. First-click-wins. */
  captured_at: string
}

export type ClickIdStore = Partial<Record<ClickIdParam, ClickIdRecord>>

export const CLICK_ID_PARAMS: readonly ClickIdParam[] = ["fbclid", "gclid"]
export const CLICK_ID_STORAGE_KEY = "hub_click_ids"
export const CLICK_ID_RETENTION_DAYS = 90

// ---------------------------------------------------------------------------
// Pure logic (no browser globals — unit-testable in isolation)
// ---------------------------------------------------------------------------

/** Extract fbclid/gclid from a URL query string (with or without leading "?"). */
export function parseClickIds(search: string): Partial<Record<ClickIdParam, string>> {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
  const out: Partial<Record<ClickIdParam, string>> = {}
  for (const param of CLICK_ID_PARAMS) {
    const value = params.get(param)?.trim()
    if (value) out[param] = value
  }
  return out
}

/**
 * Merge freshly-observed click IDs into the existing store.
 *
 * - New param            → store {id, captured_at: now}   (first touch)
 * - Same param, same id  → unchanged
 * - Same param, new id   → keep captured_at, update id     (latest ID wins,
 *                                                           first-click timestamp preserved)
 *
 * Pure: returns a new store; never mutates `existing`. `now` is injected so the
 * behavior is deterministic under test.
 */
export function mergeClickIds(
  existing: ClickIdStore,
  incoming: Partial<Record<ClickIdParam, string>>,
  now: string,
): ClickIdStore {
  const next: ClickIdStore = { ...existing }
  for (const param of CLICK_ID_PARAMS) {
    const id = incoming[param]
    if (!id) continue
    const prior = next[param]
    if (!prior) {
      next[param] = { id, captured_at: now }
    } else if (prior.id !== id) {
      next[param] = { id, captured_at: prior.captured_at }
    }
  }
  return next
}

/** True when the two stores are byte-equal (used to skip redundant writes). */
export function clickIdStoresEqual(a: ClickIdStore, b: ClickIdStore): boolean {
  return CLICK_ID_PARAMS.every((param) => {
    const x = a[param]
    const y = b[param]
    if (!x || !y) return x === y
    return x.id === y.id && x.captured_at === y.captured_at
  })
}

function isClickIdRecord(value: unknown): value is ClickIdRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ClickIdRecord).id === "string" &&
    typeof (value as ClickIdRecord).captured_at === "string"
  )
}

/** Defensively parse a persisted JSON blob back into a ClickIdStore. */
export function deserializeStore(raw: string | null | undefined): ClickIdStore {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== "object" || parsed === null) return {}
    const store: ClickIdStore = {}
    for (const param of CLICK_ID_PARAMS) {
      const record = (parsed as Record<string, unknown>)[param]
      if (isClickIdRecord(record)) store[param] = { id: record.id, captured_at: record.captured_at }
    }
    return store
  } catch {
    return {}
  }
}

// ---------------------------------------------------------------------------
// Consent seam (D0 gate — OPEN). Single point to wire real consent later.
// ---------------------------------------------------------------------------

/**
 * Whether we are permitted to store click IDs on this device.
 *
 * There is no consent tooling on the site yet, so this returns true today. When
 * a consent mechanism lands, gate it HERE (read the consent signal and return
 * false when marketing/attribution storage is not granted). Keeping this as the
 * only gate means enabling consent is a one-line change, not a sweep.
 */
export function hasClickIdConsent(): boolean {
  return true
}

// ---------------------------------------------------------------------------
// Browser storage (cookie primary, localStorage fallback/mirror)
// ---------------------------------------------------------------------------

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const prefix = `${name}=`
  for (const part of document.cookie.split(";")) {
    const cookie = part.trim()
    if (cookie.startsWith(prefix)) {
      try {
        return decodeURIComponent(cookie.slice(prefix.length))
      } catch {
        return null
      }
    }
  }
  return null
}

function writeCookie(name: string, value: string, retentionDays: number): void {
  if (typeof document === "undefined") return
  const maxAge = retentionDays * 24 * 60 * 60
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`
}

function readLocalStorage(key: string): string | null {
  try {
    return typeof window !== "undefined" ? window.localStorage.getItem(key) : null
  } catch {
    return null
  }
}

function writeLocalStorage(key: string, value: string): void {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value)
  } catch {
    // Storage may be unavailable (private mode / quota). Cookie is the primary
    // store; the mirror is best-effort.
  }
}

/** Read the persisted store, preferring the cookie and falling back to localStorage. */
export function getStoredClickIds(): ClickIdStore {
  const fromCookie = deserializeStore(readCookie(CLICK_ID_STORAGE_KEY))
  if (CLICK_ID_PARAMS.some((param) => fromCookie[param])) return fromCookie
  return deserializeStore(readLocalStorage(CLICK_ID_STORAGE_KEY))
}

function persistClickIds(store: ClickIdStore): void {
  const serialized = JSON.stringify(store)
  writeCookie(CLICK_ID_STORAGE_KEY, serialized, CLICK_ID_RETENTION_DAYS)
  writeLocalStorage(CLICK_ID_STORAGE_KEY, serialized)
}

/**
 * Capture entry point: read the current URL, merge any fbclid/gclid into the
 * persisted store, and write back only if something changed. Returns the
 * resulting store (or null when consent is not granted). Safe to call on every
 * route change — first-click-wins makes repeated calls idempotent.
 */
export function captureClickIdsFromLocation(now: string = new Date().toISOString()): ClickIdStore | null {
  if (typeof window === "undefined") return null
  if (!hasClickIdConsent()) return null

  const existing = getStoredClickIds()
  const incoming = parseClickIds(window.location.search)
  const merged = mergeClickIds(existing, incoming, now)

  if (!clickIdStoresEqual(existing, merged)) persistClickIds(merged)
  return merged
}
