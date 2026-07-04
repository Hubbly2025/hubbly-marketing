import { lookup } from "node:dns/promises";
import net from "node:net";

// SSRF protection for the user-supplied audit URL. The scan fetches this URL
// server-side, so we must reject anything that could reach internal/loopback/
// link-local/metadata addresses. Fails closed on anything we can't classify.

export class BlockedUrlError extends Error {
  constructor(reason: string) {
    super(`blocked_url: ${reason}`);
    this.name = "BlockedUrlError";
  }
}

const BLOCKED_HOSTNAMES = new Set(["localhost", "ip6-localhost", "ip6-loopback"]);
const BLOCKED_SUFFIXES = [".localhost", ".local", ".internal", ".lan", ".home", ".corp"];

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map((n) => Number(n));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return true; // fail closed
  }
  const [a, b] = parts;
  if (a === 0) return true; // "this" network
  if (a === 10) return true; // private
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local (incl. 169.254.169.254 metadata)
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast + reserved
  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const v = ip.toLowerCase();
  if (v === "::1" || v === "::") return true; // loopback / unspecified
  if (v.startsWith("fe80")) return true; // link-local
  if (v.startsWith("fc") || v.startsWith("fd")) return true; // unique local
  const mapped = v.match(/(?:::ffff:)(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIpv4(mapped[1]);
  return false;
}

function isBlockedAddress(ip: string): boolean {
  const type = net.isIP(ip);
  if (type === 4) return isPrivateIpv4(ip);
  if (type === 6) return isPrivateIpv6(ip);
  return true; // not a recognizable IP -> fail closed
}

/**
 * Throws BlockedUrlError unless `rawUrl` is an http(s) URL whose host resolves
 * exclusively to public IP addresses. Safe to call before any server-side fetch.
 */
export async function assertPublicHttpUrl(rawUrl: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new BlockedUrlError("invalid url");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new BlockedUrlError("unsupported protocol");
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!hostname) throw new BlockedUrlError("missing host");
  if (BLOCKED_HOSTNAMES.has(hostname)) throw new BlockedUrlError("loopback host");
  if (BLOCKED_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) {
    throw new BlockedUrlError("internal host");
  }

  // Literal IP address in the host: validate directly.
  if (net.isIP(hostname)) {
    if (isBlockedAddress(hostname)) throw new BlockedUrlError("private address");
    return;
  }

  // Resolve DNS and reject if any resolved address is private/internal.
  let addresses: Array<{ address: string }>;
  try {
    addresses = await lookup(hostname, { all: true });
  } catch {
    throw new BlockedUrlError("dns resolution failed");
  }

  if (!addresses.length) throw new BlockedUrlError("no addresses");
  for (const { address } of addresses) {
    if (isBlockedAddress(address)) throw new BlockedUrlError("resolves to private address");
  }
}
