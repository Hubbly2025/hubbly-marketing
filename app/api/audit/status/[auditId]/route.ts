import { NextRequest, NextResponse } from "next/server"

const DEFAULT_SUPABASE_URL = "https://fqsnvqkorwiwclbkscuj.supabase.co"

function normalizeAuditStatus(status: unknown) {
  if (status === "complete" || status === "failed") {
    return status
  }

  return "processing"
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ auditId: string }> },
) {
  const { auditId } = await context.params
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: "Audit service is not configured yet." },
      { status: 503 },
    )
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/audit_leads?id=eq.${encodeURIComponent(auditId)}&select=status`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  )

  if (!response.ok) {
    return NextResponse.json(
      { error: "Could not load audit status." },
      { status: 500 },
    )
  }

  const rows = (await response.json()) as Array<{ status: string }>
  const status = rows[0]?.status

  if (!status) {
    return NextResponse.json(
      { error: "Audit not found." },
      { status: 404 },
    )
  }

  return NextResponse.json({ status: normalizeAuditStatus(status) })
}
