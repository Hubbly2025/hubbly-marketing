import { after, NextRequest, NextResponse } from "next/server"
import { processAudit } from "@/lib/audit/process-audit"

const DEFAULT_SUPABASE_URL = "https://fqsnvqkorwiwclbkscuj.supabase.co"

function normalizeAuditUrl(value: unknown) {
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

export async function POST(request: NextRequest) {
  let normalizedUrl: string

  try {
    const formData = await request.formData()
    normalizedUrl = normalizeAuditUrl(formData.get("url"))
  } catch {
    return NextResponse.redirect(new URL("/#close", request.url), { status: 303 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    return NextResponse.redirect(new URL("/#close", request.url), { status: 303 })
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
    return NextResponse.redirect(new URL("/#close", request.url), { status: 303 })
  }

  const rows = (await response.json()) as Array<{ id: string }>
  const auditId = rows[0]?.id

  if (!auditId) {
    return NextResponse.redirect(new URL("/#close", request.url), { status: 303 })
  }

  after(async () => {
    await processAudit(auditId, normalizedUrl)
  })

  return NextResponse.redirect(new URL(`/audit/loading/${auditId}`, request.url), { status: 303 })
}
