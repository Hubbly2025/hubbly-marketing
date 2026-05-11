import type { Metadata } from "next"
import { AuditCaptureForm } from "@/components/audit/audit-capture-form"

export const metadata: Metadata = {
  title: "Send your GTM audit | Hubbly",
  robots: { index: false, follow: false },
}

export default async function AuditCapturePage({
  params,
}: {
  params: Promise<{ auditId: string }>
}) {
  const { auditId } = await params

  return <AuditCaptureForm auditId={auditId} />
}
