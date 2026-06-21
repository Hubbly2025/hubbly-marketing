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
    const formData = await request.formData()
    rawUrl = formData.get("url")
  } catch {
    return NextResponse.redirect(new URL("/#close", request.url), { status: 303 })
  }

  let prepared
  try {
    prepared = await prepareAuditScan({
      rawUrl,
      requesterKey: getRequesterKey(request),
      store: createSupabaseScanGuardStore(),
    })
  } catch {
    return NextResponse.redirect(new URL("/#close", request.url), { status: 303 })
  }

  if (prepared.status === "cache_hit") {
    return NextResponse.redirect(new URL(prepared.reportUrl, request.url), { status: 303 })
  }

  if (prepared.status === "rate_limited") {
    return NextResponse.redirect(new URL(`/?audit_throttled=1&retry_after=${prepared.retryAfterSeconds}#close`, request.url), { status: 303 })
  }

  after(async () => {
    await processAudit(prepared.auditId, prepared.normalizedUrl, prepared.metadata)
  })

  return NextResponse.redirect(new URL(`/audit/loading/${prepared.auditId}`, request.url), { status: 303 })
}
