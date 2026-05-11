import { NextRequest, NextResponse } from "next/server"

const DEFAULT_SUPABASE_URL = "https://fqsnvqkorwiwclbkscuj.supabase.co"

type AuditLeadRow = {
  id: string
  url: string
  analysis: {
    company_name?: string
    product?: string
    industry?: string
    icp?: {
      primary?: {
        title?: string
      }
    }
    competitors?: Array<{
      name?: string
    }>
    gtm_gaps?: string[]
    sample_email?: {
      subject?: string
      body?: string
    }
  } | null
  competitors?: Array<{
    name?: string
  }> | null
  intent_data: {
    monthly?: number
    weekly?: number
    highIntent?: number
    high_intent?: number
  } | null
  sample_email?: {
    subject?: string
    body?: string
  } | null
}

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

async function supabaseFetch(
  path: string,
  init: RequestInit,
) {
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

async function getAuditLead(auditId: string) {
  const response = await supabaseFetch(
    `audit_leads?id=eq.${encodeURIComponent(auditId)}&select=id,url,analysis,competitors,intent_data,sample_email`,
    { method: "GET" },
  )
  const rows = (await response.json()) as AuditLeadRow[]

  return rows[0] ?? null
}

async function sendReportEmail(params: {
  auditId: string
  email: string
  firstName: string
  companyName?: string
  audit?: AuditLeadRow | null
}) {
  const resendApiKey = process.env.RESEND_API_KEY || process.env.Resend

  if (!resendApiKey) {
    console.log("Email not sent — RESEND_API_KEY not configured")
    return { sent: false, reason: "RESEND_API_KEY is not configured" }
  }

  const company = getCompanyName(params.companyName, params.audit)
  const html = buildReportEmail(params.auditId, params.firstName, params.companyName, params.audit)

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Hubbly <reports@hubbly.io>",
      to: params.email,
      subject: `Your Hubbly GTM Report for ${company} is ready`,
      html,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    console.log(`Email not sent — Resend returned ${response.status}: ${detail}`)
    return { sent: false, reason: `Resend returned ${response.status}` }
  }

  return { sent: true }
}

function buildReportEmail(
  auditId: string,
  firstName: string,
  companyName?: string,
  audit?: AuditLeadRow | null,
) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hubbly.io"
  const reportUrl = `${siteUrl}/audit/report/${auditId}`
  const name = escapeHtml(getCompanyName(companyName, audit))
  const monthly = audit?.intent_data?.monthly ?? 0
  const primaryBuyer = escapeHtml(audit?.analysis?.icp?.primary?.title || "Primary buyer unavailable")
  const topCompetitor = escapeHtml(getTopCompetitor(audit))
  const biggestGap = escapeHtml(audit?.analysis?.gtm_gaps?.[0] || "GTM gap unavailable")
  const sampleEmail = audit?.sample_email ?? audit?.analysis?.sample_email
  const sampleSubject = escapeHtml(sampleEmail?.subject || "Sample subject unavailable")
  const sampleFirstSentence = escapeHtml(getFirstSentence(sampleEmail?.body))

  return `
    <!doctype html>
    <html>
      <body style="margin:0;background:#0A0A0A;color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;">
        <div style="background:#0A0A0A;padding:32px 16px;">
          <div style="max-width:600px;margin:0 auto;border:1px solid rgba(255,107,53,0.35);background:#101010;">
            <div style="padding:28px 28px 20px;border-bottom:1px solid rgba(255,107,53,0.55);">
              <div style="font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#FFFFFF;">Hubbly</div>
              <div style="margin-top:16px;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#FF6B35;">GTM Intelligence Report</div>
              <h1 style="margin:22px 0 0;text-align:center;font-size:32px;line-height:1.1;color:#FFFFFF;font-weight:700;">${name}</h1>
            </div>

            <div style="padding:34px 28px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.10);">
              <div style="font-size:64px;line-height:0.95;color:#FF6B35;font-weight:800;letter-spacing:-0.04em;">${formatNumber(monthly)}</div>
              <p style="margin:18px auto 0;max-width:430px;font-size:22px;line-height:1.35;color:#FFFFFF;">
                people searched for solutions like yours last month.
              </p>
            </div>

            <div style="padding:28px;border-bottom:1px solid rgba(255,255,255,0.10);">
              <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#FF6B35;margin-bottom:16px;">Three key findings</div>
              <div style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.10);color:#D7D7D7;font-size:15px;"><strong style="color:#FFFFFF;">Your primary buyer:</strong> ${primaryBuyer}</div>
              <div style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.10);color:#D7D7D7;font-size:15px;"><strong style="color:#FFFFFF;">Top competitor:</strong> ${topCompetitor}</div>
              <div style="padding:14px 0;color:#D7D7D7;font-size:15px;"><strong style="color:#FFFFFF;">Biggest GTM gap:</strong> ${biggestGap}</div>
            </div>

            <div style="padding:28px;border-bottom:1px solid rgba(255,255,255,0.10);">
              <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#FF6B35;margin-bottom:16px;">Hubbly would send this on your behalf</div>
              <div style="background:#FFFFFF;color:#0A0A0A;padding:20px;border-radius:0;">
                <div style="font-size:12px;color:#555555;border-bottom:1px solid #E5E5E5;padding-bottom:12px;">
                  <strong>Subject:</strong> ${sampleSubject}
                </div>
                <p style="font-size:15px;line-height:1.65;margin:16px 0 0;color:#1F1F1F;">${sampleFirstSentence}</p>
              </div>
            </div>

            <div style="padding:34px 28px;text-align:center;">
              <a href="${reportUrl}" style="display:inline-block;background:#FF6B35;color:#0A0A0A;text-decoration:none;padding:16px 24px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;font-weight:800;">
                View My Full Report →
              </a>
              <p style="margin:24px auto 0;max-width:460px;color:#D7D7D7;font-size:15px;line-height:1.6;">
                Hubbly OS executes this entire GTM plan automatically — from finding buyers to booking meetings. Reply to this email to get started.
              </p>
            </div>

            <div style="padding:22px 28px;border-top:1px solid rgba(255,255,255,0.10);color:#8F8F8F;font-size:12px;line-height:1.7;text-align:center;">
              <div>The Hubbly Corporation</div>
              <div><a href="https://hubbly.io" style="color:#FF6B35;text-decoration:none;">hubbly.io</a></div>
              <div><a href="mailto:hello@hubbly.io?subject=Unsubscribe" style="color:#8F8F8F;text-decoration:underline;">Unsubscribe</a></div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}

function getCompanyName(companyName?: string, audit?: AuditLeadRow | null) {
  return companyName || audit?.analysis?.company_name || "your company"
}

function getTopCompetitor(audit?: AuditLeadRow | null) {
  return audit?.competitors?.[0]?.name || audit?.analysis?.competitors?.[0]?.name || "Competitor unavailable"
}

function getFirstSentence(value?: string) {
  if (!value) return "Sample email preview unavailable."

  return value.split(/(?<=[.!?])\s+/)[0] || value
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)

  if (!body?.audit_id || typeof body.audit_id !== "string") {
    return NextResponse.json({ error: "Missing audit ID." }, { status: 400 })
  }

  if (!body?.first_name || typeof body.first_name !== "string" || !body.first_name.trim()) {
    return NextResponse.json({ error: "First name is required." }, { status: 400 })
  }

  if (!isValidEmail(body?.email)) {
    return NextResponse.json({ error: "Valid email is required." }, { status: 400 })
  }

  const auditId = body.audit_id.trim()
  const firstName = body.first_name.trim()
  const email = body.email.trim().toLowerCase()
  const company = typeof body.company === "string" && body.company.trim() ? body.company.trim() : null
  const weeklyOptin = Boolean(body.weekly_optin)

  try {
    await supabaseFetch(`audit_leads?id=eq.${encodeURIComponent(auditId)}`, {
      method: "PATCH",
      body: JSON.stringify({
        email,
        first_name: firstName,
        company,
        weekly_optin: weeklyOptin,
      }),
    })

    const audit = await getAuditLead(auditId)
    const companyName = company || audit?.analysis?.company_name

    if (weeklyOptin) {
      await supabaseFetch("newsletter_subscribers?on_conflict=email", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({
          email,
          first_name: firstName,
          source: "audit",
          active: true,
        }),
      })
    }

    await supabaseFetch("leads", {
      method: "POST",
      body: JSON.stringify({
        name: firstName,
        email,
        company,
        source: "audit",
        status: "new",
        score: 75,
      }),
    })

    const emailResult = await sendReportEmail({
      auditId,
      email,
      firstName,
      companyName,
      audit,
    })

    return NextResponse.json({
      success: true,
      report_url: `/audit/report/${auditId}`,
      email_sent: emailResult.sent,
      email_fallback: emailResult.sent ? null : emailResult.reason,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Something went wrong. Please try again." },
      { status: 500 },
    )
  }
}
