import { NextRequest, NextResponse } from "next/server"

type ContactPayload = {
  name?: string
  email?: string
  company?: string
  topic?: string
  message?: string
}

function isValidEmail(value: unknown) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

async function sendEmail(params: { to: string; subject: string; html: string; replyTo?: string }) {
  const resendApiKey = process.env.RESEND_API_KEY || process.env.Resend
  if (!resendApiKey) {
    console.log("[v0] Contact email not sent — RESEND_API_KEY not configured")
    return
  }

  const { replyTo, ...rest } = params
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Hubbly <hello@hubbly.io>",
      ...(replyTo ? { reply_to: replyTo } : {}),
      ...rest,
    }),
  }).catch((error) => {
    console.log("[v0] Contact email failed", error)
  })
}

function confirmationEmail(name: string) {
  return `
    <div style="background:#0A0A0A;color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;padding:32px;">
      <div style="max-width:600px;margin:0 auto;border:1px solid rgba(255,107,53,.35);padding:28px;">
        <div style="font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:#FF6B35;">Hubbly</div>
        <h1 style="font-size:30px;line-height:1.15;margin:24px 0 12px;">Thanks for reaching out, ${escapeHtml(name)}.</h1>
        <p style="color:#D7D7D7;line-height:1.6;">We received your message and a member of the team will get back to you within one business day.</p>
        <p style="color:#D7D7D7;line-height:1.6;margin-top:16px;">In the meantime, you can run a free revenue audit at hubbly.io.</p>
      </div>
    </div>
  `
}

function internalEmail(row: Record<string, unknown>) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;">
      <h2>New Hubbly contact message</h2>
      <pre style="white-space:pre-wrap;background:#f6f6f6;padding:16px;">${escapeHtml(JSON.stringify(row, null, 2))}</pre>
    </div>
  `
}

export async function POST(request: NextRequest) {
  let payload: ContactPayload

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const name = payload.name?.trim()
  const email = payload.email?.trim().toLowerCase()
  const company = payload.company?.trim()
  const topic = payload.topic?.trim()
  const message = payload.message?.trim()

  if (!name || !isValidEmail(email) || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const row = {
    name,
    email,
    company: company || null,
    topic: topic || "general",
    message,
    submitted_at: new Date().toISOString(),
  }

  try {
    await sendEmail({
      to: email as string,
      subject: "We received your message — Hubbly",
      html: confirmationEmail(name),
    })

    await sendEmail({
      to: process.env.CONTACT_NOTIFY_EMAIL || "hello@hubbly.io",
      subject: `New contact message: ${topic || "general"} — ${name}`,
      html: internalEmail(row),
      replyTo: email,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send message" },
      { status: 500 },
    )
  }
}
