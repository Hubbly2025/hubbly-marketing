/**
 * Shared audit URL normalizer for the /api/audit/start and /api/audit/form
 * entry points (the logic used to be copy-pasted in both).
 *
 * The important rule: `new URL("https://a16z")` is a *valid* URL with hostname
 * "a16z", so a bare company name used to sail through validation. The audit
 * would then start, fail DNS on every fetch, and only surface a generic
 * "Something went wrong analyzing that URL." a minute later. Requiring a real
 * dotted hostname with a plausible TLD rejects that instantly, with a message
 * that tells the user what to type instead.
 */

/** Hostnames that parse fine but can never be a customer's public website. */
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"])

export class InvalidAuditUrlError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InvalidAuditUrlError"
  }
}

export function normalizeAuditUrl(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new InvalidAuditUrlError("Enter a website URL.")
  }

  if (value.length > 2048) {
    throw new InvalidAuditUrlError("Enter a valid website URL.")
  }

  const trimmed = value.trim()
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  let parsed: URL
  try {
    parsed = new URL(withProtocol)
  } catch {
    throw new InvalidAuditUrlError("Enter a valid website URL, like example.com")
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new InvalidAuditUrlError("Enter a valid website URL.")
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "")

  if (LOCAL_HOSTNAMES.has(hostname)) {
    throw new InvalidAuditUrlError("Enter a public website URL.")
  }

  // A real public site needs a dotted hostname ending in a plausible TLD.
  // This is what rejects bare input like "a16z" before we burn a scan on it.
  if (!hostname.includes(".")) {
    throw new InvalidAuditUrlError(
      // Echo the parsed hostname, not the raw input: the hero form prepends
      // "https://" client-side, which would otherwise surface to the user as
      // the confusing `"https://a16z" is missing a domain ending`.
      `"${hostname}" is missing a domain ending. Try ${hostname}.com instead.`,
    )
  }

  if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(hostname)) {
    throw new InvalidAuditUrlError("Enter a valid website URL, like example.com")
  }

  parsed.hash = ""
  parsed.search = ""
  parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/"

  return parsed.toString().replace(/\/$/, "")
}
