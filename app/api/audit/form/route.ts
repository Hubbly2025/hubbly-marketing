import { after, NextRequest, NextResponse } from "next/server"
import { processAudit } from "@/lib/audit/process-audit"
import { rateLimit } from "@/lib/seo-report/redis"
import { assertPublicHttpUrl } from "@/lib/seo-report/url-guard"

const DEFAULT_SUPABASE_URL = "https://fqsnvqkorwiwclbkscuj.supabase.co"

function getClientIp(request: NextRequest): string {
  // Prefer the platform-controlled header. Vercel overwrites x-forwarded-for
  // with the real TCP peer, so it is not client-spoofable here, but
  // x-vercel-forwarded-for stays correct even if a proxy is put in front later.
  // x-real-ip is deliberately not trusted: it is caller-supplied on some
  // topologies, which would let an attacker rotate it to evade the rate limit.
  const vercelForwarded = request.headers.get("x-vercel-forwarded-for")
  if (vercelForwarded) return vercelForwarded.split(",")[0]!.trim()

  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]!.trim()

  return "unknown"
}

function normalizeAuditUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Enter a website URL.")
  }

  if (value.length > 2048) {
    throw new Error("Enter a valid website URL.")
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

export async function POST(request: NextRequest) {
  let normalizedUrl: string

  try {
    const formData = await request.formData()
    normalizedUrl = normalizeAuditUrl(formData.get("url"))
    // normalizeAuditUrl only validates shape and protocol. This rejects hosts
    // that resolve into private/loopback/link-local space before we create a
    // lead row or schedule any server-side fetch of the submitted URL.
    await assertPublicHttpUrl(normalizedUrl)
  } catch {
    return NextResponse.redirect(new URL("/?audit_error=invalid#audit", request.url), { status: 303 })
  }

  const limit = await rateLimit(`audit:${getClientIp(request)}`)
  if (!limit.ok) {
    return NextResponse.redirect(new URL("/?audit_error=throttled#audit", request.url), { status: 303 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    return NextResponse.redirect(new URL("/?audit_error=unavailable#audit", request.url), { status: 303 })
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/audit_leads?select=id`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      url: normalizedUrl,
      status: "processing",
    }),
  })

  if (!response.ok) {
    return NextResponse.redirect(new URL("/?audit_error=unavailable#audit", request.url), { status: 303 })
  }

  const rows = (await response.json()) as Array<{ id: string }>
  const auditId = rows[0]?.id

  if (!auditId) {
    return NextResponse.redirect(new URL("/?audit_error=unavailable#audit", request.url), { status: 303 })
  }

  after(async () => {
    await processAudit(auditId, normalizedUrl)
  })

  return NextResponse.redirect(new URL(`/audit/loading/${auditId}`, request.url), { status: 303 })
}
