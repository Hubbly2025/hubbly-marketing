import type { Metadata } from "next"
import { SendPageContent } from "@/components/send-page-content"
import { pageMetadata, productJsonLd } from "@/lib/seo"
import { PRODUCT_LINES_TAGLINE } from "@/lib/products"

const appJsonLd = productJsonLd({
  name: "Hubbly Send",
  description:
    "Hubbly Send is the email layer of Hubbly — sequencing, deliverability, and replies, with leads and copy arriving already attached from the pipeline. " +
    PRODUCT_LINES_TAGLINE,
  path: "/mail",
})

export const metadata: Metadata = pageMetadata({
  title: "Hubbly Send — Cold email, built in",
  description:
    "Send is Hubbly's email layer — the outbound engine inside the growth system. Leads, copy, and deliverability arrive already attached from the pipeline.",
  path: "/mail",
})

export default function MailPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
      <SendPageContent />
    </>
  )
}
