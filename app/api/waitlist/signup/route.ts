import { NextRequest, NextResponse } from "next/server"

const DEFAULT_SUPABASE_URL = "https://fqsnvqkorwiwclbkscuj.supabase.co"

type WaitlistPayload = {
  email?: string
  company?: string
  role?: string
  company_size?: string
  current_tools?: string
  pain_points?: string
  expected_results?: string
  timeline?: string
  utm_source?: string
  audit_url?: string
  audit_data?: Record<string, unknown>
}

function isValidEmail(value: unknown) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error("Waitlist service is not configured yet.")
  }

  return { url, serviceRoleKey }
}

function calculatePriorityScore(data: Required<Pick<WaitlistPayload, "role" | "company_size" | "pain_points" | "expected_results">> & Pick<WaitlistPayload, "timeline">) {
  let score = 0

  if (data.role === "founder") score += 30
  if (data.role === "cmo" || data.role === "cro") score += 25
  if (data.role === "marketing_manager" || data.role === "sales_manager") score += 20

  if (data.company_size === "51-200" || data.company_size === "201-1000") score += 25
  if (data.company_size === "11-50") score += 20
  if (data.company_size === "1000+") score += 15

  if (data.timeline === "immediate") score += 30
  if (data.timeline === "30_days") score += 20
  if (data.timeline === "90_days") score += 10

  const urgencyText = `${data.pain_points} ${data.expected_results}`.toLowerCase()
  for (const keyword of ["scaling", "growing", "hiring", "revenue", "pipeline", "leads", "conversion", "outbound"]) {
    if (urgencyText.includes(keyword)) score += 5
  }

  return Math.min(score, 100)
}

async function sendEmail(params: { to: string; subject: string; html: string }) {
  const resendApiKey = process.env.RESEND_API_KEY || process.env.Resend
  if (!resendApiKey) {
    console.log("Waitlist email not sent — RESEND_API_KEY not configured")
    return
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Hubbly <hello@hubbly.io>",
      ...params,
    }),
  }).catch((error) => {
    console.log("Waitlist email failed", error)
  })
}

function confirmationEmail(company: string) {
  return `
    <div style="background:#0A0A0A;color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;padding:32px;">
      <div style="max-width:600px;margin:0 auto;border:1px solid rgba(255,107,53,.35);padding:28px;">
        <div style="font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:#FF6B35;">Hubbly</div>
        <h1 style="font-size:30px;line-height:1.15;margin:24px 0 12px;">You're on the waitlist.</h1>
        <p style="color:#D7D7D7;line-height:1.6;">Thanks for requesting access for ${escapeHtml(company)}. We're reviewing your audit and will send next steps for early access.</p>
        <div style="margin-top:24px;padding:18px;background:rgba(255,107,53,.08);border:1px solid rgba(255,107,53,.25);color:#F5F5F5;line-height:1.7;">
          <div>1. Complete revenue audit delivered to your inbox.</div>
          <div>2. Strategy session scheduled if there is a strong fit.</div>
          <div>3. Early access as private beta slots open.</div>
        </div>
      </div>
    </div>
  `
}

function internalEmail(row: Record<string, unknown>) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;">
      <h2>New Hubbly waitlist signup</h2>
      <pre style="white-space:pre-wrap;background:#f6f6f6;padding:16px;">${escapeHtml(JSON.stringify(row, null, 2))}</pre>
    </div>
  `
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export async function POST(request: NextRequest) {
  let payload: WaitlistPayload

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : ""
  const company = payload.company?.trim()
  const role = payload.role?.trim()
  const companySize = payload.company_size?.trim()
  const painPoints = payload.pain_points?.trim()
  const expectedResults = payload.expected_results?.trim()

  if (!isValidEmail(email) || !company || !role || !companySize || !painPoints || !expectedResults) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const priorityScore = calculatePriorityScore({
    role,
    company_size: companySize,
    pain_points: painPoints,
    expected_results: expectedResults,
    timeline: payload.timeline,
  })

  try {
    const { url, serviceRoleKey } = getSupabaseConfig()
    const row = {
      email,
      company,
      role,
      company_size: companySize,
      current_tools: payload.current_tools?.trim() || null,
      pain_points: painPoints,
      expected_results: expectedResults,
      timeline: payload.timeline?.trim() || null,
      utm_source: payload.utm_source?.trim() || null,
      audit_url: payload.audit_url?.trim() || null,
      audit_data: payload.audit_data ?? {},
      priority_score: priorityScore,
      status: "pending",
    }

    const response = await fetch(`${url}/rest/v1/waitlist_signups?on_conflict=email&select=*`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(row),
    })

    if (!response.ok) {
      const detail = await response.text()
      const isMissingTable = detail.includes("waitlist_signups")
      return NextResponse.json(
        {
          error: isMissingTable
            ? "Waitlist table is not installed yet. Apply migration 20260511093000_waitlist_signups.sql."
            : "Failed to join waitlist",
          detail,
        },
        { status: 500 },
      )
    }

    const rows = (await response.json()) as Array<Record<string, unknown>>
    const saved = rows[0] ?? row

    await sendEmail({
      to: email,
      subject: "You're on the Hubbly waitlist",
      html: confirmationEmail(company),
    })

    await sendEmail({
      to: process.env.WAITLIST_NOTIFY_EMAIL || "hello@hubbly.io",
      subject: `New Hubbly waitlist signup: ${company}`,
      html: internalEmail(saved),
    })

    return NextResponse.json({ success: true, signup_id: saved.id, priority_score: priorityScore })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to join waitlist" },
      { status: 500 },
    )
  }
}
