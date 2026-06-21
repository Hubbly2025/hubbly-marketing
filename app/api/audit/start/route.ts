import { after, NextRequest, NextResponse } from "next/server"
import { processAudit } from "@/lib/audit/process-audit"
import {
  createSupabaseScanGuardStore,
  getRequesterKey,
  prepareAuditScan,
} from "@/lib/audit/scan-guards"

export async function POST(request: NextRequest) {
  let rawUrl: unknown

  try {
    const body = await request.json()
    rawUrl = body?.url
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Enter a valid website URL." },
      { status: 400 },
    )
  }

  let prepared
  try {
    prepared = await prepareAuditScan({
      rawUrl,
      requesterKey: getRequesterKey(request),
      store: createSupabaseScanGuardStore(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not start the audit." },
      { status: error instanceof Error && error.message.includes("website") ? 400 : 503 },
    )
  }

  if (prepared.status === "cache_hit") {
    return NextResponse.json(
      {
        audit_id: prepared.auditId,
        cached: true,
        report_url: prepared.reportUrl,
        scanned_at: prepared.scannedAt,
        cache: prepared.cache,
      },
    )
  }

  if (prepared.status === "rate_limited") {
    return NextResponse.json(
      {
        error: prepared.message,
        retry_after_seconds: prepared.retryAfterSeconds,
        reset_at: prepared.resetAt,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(prepared.retryAfterSeconds),
        },
      },
    )
  }

  after(async () => {
    await processAudit(prepared.auditId, prepared.normalizedUrl, prepared.metadata)
  })

  return NextResponse.json({ audit_id: prepared.auditId, cached: false })
}
