import type { Metadata } from "next"
import { Space_Grotesk, JetBrains_Mono } from "next/font/google"
import { AuditLoadingScreen } from "@/components/audit/audit-loading-screen"

const spaceGrotesk = Space_Grotesk({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
})

const jetBrainsMono = JetBrains_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

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

  return (
    <div className={`${spaceGrotesk.variable} ${jetBrainsMono.variable}`}>
      <AuditLoadingScreen auditId={auditId} />
    </div>
  )
}
