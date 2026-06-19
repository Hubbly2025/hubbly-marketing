"use server"

export type AuditLeadResult = { ok: true } | { ok: false; error: string }

type AuditLead = {
  url: string
  email: string
  createdAt: string
  source: "audit-form"
}

const URL_REGEX = /^(https?:\/\/)?([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(\/\S*)?$/i
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * saveAuditLead — single source of truth for persisting an audit lead.
 *
 * Right now there is no database connected, so this just logs the payload
 * server-side. To wire up real storage later, replace ONLY the body of this
 * function — e.g. insert into Supabase, write to a KV store, or POST to a CRM.
 * The shape of `lead` is intentionally stable so callers never need to change.
 */
async function saveAuditLead(lead: AuditLead): Promise<void> {
  // [v0] swap this console.log for a real persistence call (DB / KV / CRM / email).
  console.log("[v0] audit-lead captured:", lead)
}

export async function submitAuditLead(formData: FormData): Promise<AuditLeadResult> {
  try {
    const url = String(formData.get("url") ?? "").trim()
    const email = String(formData.get("email") ?? "").trim()

    if (!URL_REGEX.test(url)) {
      return { ok: false, error: "Enter a valid website (e.g. yourcompany.com)" }
    }
    if (!EMAIL_REGEX.test(email)) {
      return { ok: false, error: "Enter a valid work email" }
    }

    await saveAuditLead({
      url,
      email,
      createdAt: new Date().toISOString(),
      source: "audit-form",
    })

    return { ok: true }
  } catch (error) {
    console.log("[v0] audit-lead error:", error)
    return { ok: false, error: "Something went wrong — please try again" }
  }
}
