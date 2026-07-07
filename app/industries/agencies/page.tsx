import type { Metadata } from "next"
import { LandingPageTemplate } from "@/components/landing-page-template"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "AI Outbound for Marketing & Sales Agencies",
  description:
    "Run client outbound at agency scale. Hubbly delivers white-label autonomous outbound with reporting per client.",
  path: "/industries/agencies",
})

export default function AgenciesIndustryPage() {
  return (
    <LandingPageTemplate
      eyebrow="Industry"
      title="Agency Sales Automation"
      subtitle="AI-powered new business development for marketing, staffing, and consulting firms."
      description="Hubbly helps agencies automate new business development without adding headcount. Whether you're a marketing agency, staffing firm, or consulting business, Hubbly finds companies showing buying signals for your services and books qualified discovery calls."
      problem={{
        heading: "Agency new business challenges",
        points: [
          "Agency principals are too busy with client work to consistently prospect for new business.",
          "Hiring dedicated business development reps is expensive and often produces inconsistent results.",
          "Generic outbound feels spammy and doesn't reflect the consultative relationship agencies build with clients.",
          "Most agencies rely on referrals and inbound — unpredictable sources that don't scale.",
        ],
      }}
      solution={{
        heading: "How Hubbly serves agencies",
        points: [
          "Hubbly analyzes your agency's positioning, case studies, and ideal client profile to understand your best-fit prospects.",
          "It identifies companies showing intent signals for your services: hiring marketers, launching products, fundraising, or showing tech stack changes.",
          "AI writes personalized outreach that reflects your agency's voice and highlights relevant case studies.",
          "Discovery calls book directly to your calendar while Hubbly handles follow-up with non-responders.",
        ],
      }}
      benefits={{
        heading: "Why agencies choose Hubbly",
        items: [
          {
            title: "Predictable pipeline",
            description: "Stop relying solely on referrals. Hubbly creates a consistent flow of qualified discovery calls without hiring BDRs.",
          },
          {
            title: "Consultative positioning",
            description: "AI outreach reflects your agency's expertise and positions you as a strategic partner, not a vendor pitching services.",
          },
          {
            title: "Intent-based targeting",
            description: "Find companies actively looking for help: new funding announcements, job postings, product launches, agency reviews.",
          },
          {
            title: "White-label ready",
            description: "Agencies can offer Hubbly as a service to clients, creating a new revenue stream from lead generation.",
          },
        ],
      }}
      cta={{
        primary: "Automate agency sales",
        secondary: "See it in action",
      }}
    />
  )
}
