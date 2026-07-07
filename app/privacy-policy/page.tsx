import type { Metadata } from "next"
import { PrivacyPolicyContent } from "./content"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Privacy Policy",
    description: "Hubbly privacy policy.",
    path: "/privacy-policy",
  }),
  robots: { index: true, follow: true },
}

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyContent />
}
