import { NextRequest, NextResponse } from "next/server"

const DEFAULT_SUPABASE_URL = "https://fqsnvqkorwiwclbkscuj.supabase.co"

function isValidEmail(value: unknown) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error("Audit service is not configured yet.")
  }

  return { url, serviceRoleKey }
}

async function supabaseFetch(path: string, init: RequestInit) {
  const { url, serviceRoleKey } = getSupabaseConfig()
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(`Supabase request failed: ${response.status} ${await response.text()}`)
  }

  return response
}

async function getAudit(auditId: string) {
  const response = await supabaseFetch(
    `audit_leads?id=eq.${encodeURIComponent(auditId)}&select=id,url,email,first_name,company,analysis`,
    { method: "GET" },
  )
  const rows = (await response.json()) as Array<{
    id: string
    url: string
    email?: string | null
    first_name?: string | null
    company?: string | null
    analysis?: Record<string, unknown> | null
  }>

  return rows[0] ?? null
}

async function sendManualEmails(params: {
  auditId: string
  url: string
  email: string
  firstName: string
  reason?: string
}) {
  const resendApiKey = process.env.RESEND_API_KEY || process.env.Resend

  if (!resendApiKey) {
    console.log(`[audit:${params.auditId}] WARN manual_email: RESEND_API_KEY not configured`)
    return
  }

  const reportUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://hubbly.io"}/audit/report/${params.auditId}`
  const headers = {
    Authorization: `Bearer ${resendApiKey}`,
    "Content-Type": "application/json",
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify({
      from: "Hubbly <reports@hubbly.io>",
      to: params.email,
      subject: "Your Hubbly audit is being reviewed",
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111111;">
          <h2>We're reviewing your Hubbly audit</h2>
          <p>Hi ${escapeHtml(params.firstName)},</p>
          <p>We hit a technical issue while sending the automated report for ${escapeHtml(params.url)}.</p>
          <p>Your audit is queued for manual review. We'll send the result as soon as it is ready.</p>
          <p>You can also check the report page here: <a href="${reportUrl}">${reportUrl}</a></p>
        </div>
      `,
    }),
  }).catch((error) => {
    console.log(`[audit:${params.auditId}] WARN manual_user_email_failed: ${getErrorMessage(error)}`)
  })

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify({
      from: "Hubbly <reports@hubbly.io>",
      to: "hello@hubbly.io",
      subject: `Manual audit requested: ${params.email}`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111111;">
          <h2>Manual audit requested</h2>
          <p><strong>Email:</strong> ${escapeHtml(params.email)}</p>
          <p><strong>URL:</strong> ${escapeHtml(params.url)}</p>
          <p><strong>Audit ID:</strong> ${escapeHtml(params.auditId)}</p>
          <p><strong>Reason:</strong> ${escapeHtml(params.reason || "Manual fallback requested")}</p>
          <p><a href="${reportUrl}">Open report</a></p>
        </div>
      `,
    }),
  }).catch((error) => {
    console.log(`[audit:${params.auditId}] WARN manual_internal_email_failed: ${getErrorMessage(error)}`)
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)

  if (!body?.audit_id || typeof body.audit_id !== "string") {
    return NextResponse.json({ error: "Missing audit ID." }, { status: 400 })
  }

  if (!isValidEmail(body?.email)) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 })
  }

  const auditId = body.audit_id.trim()
  const email = body.email.trim().toLowerCase()
  const firstName = typeof body.first_name === "string" && body.first_name.trim() ? body.first_name.trim() : "there"
  const company = typeof body.company === "string" && body.company.trim() ? body.company.trim() : null
  const reason = typeof body.reason === "string" ? body.reason.slice(0, 500) : "Manual fallback requested"

  try {
    const audit = await getAudit(auditId)

    if (!audit) {
      return NextResponse.json({ error: "Audit not found." }, { status: 404 })
    }

    const existingAnalysis = audit.analysis ?? {}
    await supabaseFetch(`audit_leads?id=eq.${encodeURIComponent(auditId)}`, {
      method: "PATCH",
      body: JSON.stringify({
        email,
        first_name: firstName,
        company,
        analysis: {
          ...existingAnalysis,
          manual_queue: {
            requested: true,
            status: "queued",
            priority: "high",
            reason,
            requested_at: new Date().toISOString(),
          },
        },
      }),
    })

    console.log(`[audit:${auditId}] INFO manual_queue: Manual audit queued`, {
      email,
      url: audit.url,
      reason,
    })

    await sendManualEmails({
      auditId,
      url: audit.url,
      email,
      firstName,
      reason,
    })

    return NextResponse.json({ success: true, status: "queued" })
  } catch (error) {
    console.log(`[audit:${auditId}] ERROR manual_queue_failed: ${getErrorMessage(error)}`)
    return NextResponse.json(
      { error: "We could not queue manual delivery. Email hello@hubbly.io and we'll handle it directly." },
      { status: 500 },
    )
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
