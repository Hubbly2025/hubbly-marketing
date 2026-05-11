import { NextRequest, NextResponse } from "next/server"

const DEFAULT_SUPABASE_URL = "https://fqsnvqkorwiwclbkscuj.supabase.co"

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error("Audit service is not configured yet.")
  }

  return { url, serviceRoleKey }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ auditId: string }> },
) {
  const { auditId } = await context.params

  try {
    const { url, serviceRoleKey } = getSupabaseConfig()
    const response = await fetch(
      `${url}/rest/v1/audit_leads?id=eq.${encodeURIComponent(auditId)}&select=*`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        cache: "no-store",
      },
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: "Could not load audit." },
        { status: 500 },
      )
    }

    const rows = await response.json()
    const audit = rows[0] ?? null

    if (!audit) {
      return NextResponse.json({ error: "Audit not found." }, { status: 404 })
    }

    return NextResponse.json({ audit })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load audit." },
      { status: 500 },
    )
  }
}
