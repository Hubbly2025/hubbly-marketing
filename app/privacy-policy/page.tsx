import type { Metadata } from "next"
import { PrivacyPolicyContent } from "./content"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Hubbly privacy policy.",
  alternates: { canonical: "https://hubbly.io/privacy-policy" },
  robots: { index: true, follow: true },
}

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyContent />
}
