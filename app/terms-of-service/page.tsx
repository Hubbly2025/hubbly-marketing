import type { Metadata } from "next"
import { TermsOfServiceContent } from "./content"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Hubbly terms of service.",
  alternates: { canonical: "https://hubbly.io/terms-of-service" },
  robots: { index: true, follow: true },
}

export default function TermsOfServicePage() {
  return <TermsOfServiceContent />
}
