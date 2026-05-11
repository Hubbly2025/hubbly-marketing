import type { Metadata } from "next"
import { AuditReportPage } from "@/components/audit/audit-report-page"

export const metadata: Metadata = {
  title: "GTM Intelligence Report | Hubbly",
  robots: { index: false, follow: false },
}

export default async function AuditReportRoute({
  params,
}: {
  params: Promise<{ auditId: string }>
}) {
  const { auditId } = await params

  return <AuditReportPage auditId={auditId} />
}
