import { after, NextRequest, NextResponse } from "next/server"
import { InvalidAuditUrlError, normalizeAuditUrl } from "@/lib/audit/normalize-url"
import { processAudit } from "@/lib/audit/process-audit"
import { rateLimit } from "@/lib/seo-report/redis"

const DEFAULT_SUPABASE_URL = "https://fqsnvqkorwiwclbkscuj.supabase.co"

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]!.trim()
  return request.headers.get("x-real-ip")?.trim() || "unknown"
}

export async function POST(request: NextRequest) {
  let normalizedUrl: string

  try {
    const formData = await request.formData()
    normalizedUrl = normalizeAuditUrl(formData.get("url"))
  } catch (error) {
    // Carry the specific validation reason (e.g. "Try a16z.com instead") through
    // to the form instead of collapsing every bad input into one generic string.
    const target = new URL("/", request.url)
    target.searchParams.set("audit_error", "invalid")
    if (error instanceof InvalidAuditUrlError) {
      target.searchParams.set("audit_error_detail", error.message.slice(0, 160))
    }
    return NextResponse.redirect(new URL(`${target.pathname}?${target.searchParams}#audit`, request.url), {
      status: 303,
    })
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
