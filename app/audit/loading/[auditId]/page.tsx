import type { Metadata } from "next"
import { AuditLoadingScreen } from "@/components/audit/audit-loading-screen"

export const metadata: Metadata = {
  title: "Building your GTM audit | Hubbly",
  robots: { index: false, follow: false },
}

export default async function AuditLoadingPage({
  params,
}: {
  params: Promise<{ auditId: string }>
}) {
  const { auditId } = await params

  return <AuditLoadingScreen auditId={auditId} />
}
