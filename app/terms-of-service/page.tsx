import type { Metadata } from "next"
import { TermsOfServiceContent } from "./content"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Terms of Service",
    description: "Hubbly terms of service.",
    path: "/terms-of-service",
  }),
  robots: { index: true, follow: true },
}

export default function TermsOfServicePage() {
  return <TermsOfServiceContent />
}
