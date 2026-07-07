import type { Metadata } from "next"
import { LandingPageTemplate } from "@/components/landing-page-template"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "AI Outbound for Financial Services",
  description:
    "Hubbly for financial services: compliant AI-driven prospecting, enrichment, and voice outreach for advisors and fintechs.",
  path: "/industries/financial-services",
})

export default function FinancialServicesIndustryPage() {
  return (
    <LandingPageTemplate
      eyebrow="Industry"
      title="Financial Services Sales Automation"
      subtitle="AI agents built for wealth management, tax relief, lending, and advisory teams."
      description="Hubbly provides specialized AI agents for financial services teams. Alex handles tax relief. Cameron handles wealth management and lending. Both understand financial terminology, compliance requirements, and the trust-building process that financial services requires."
      problem={{
        heading: "Financial services sales challenges",
        points: [
          "Financial services require trust — generic cold outreach damages credibility before conversations start.",
          "Compliance requirements (SEC, FINRA, state regulations) make automation risky without proper guardrails.",
          "High-value clients expect personalized outreach, not mass emails that feel like they came from a template.",
          "Most financial services firms rely on referrals, leaving growth dependent on unpredictable sources.",
        ],
      }}
      solution={{
        heading: "How Hubbly serves financial services teams",
        points: [
          "Alex and Cameron are vertical-specific AI agents trained on financial terminology, compliance language, and consultative sales.",
          "Hubbly identifies prospects showing financial intent: business owners researching tax strategies, individuals comparing wealth management options, companies seeking lending.",
          "AI writes personalized outreach that positions your firm as a trusted advisor, not a vendor.",
          "Voice agents handle initial conversations, qualify needs, and book appointments for licensed advisors.",
        ],
      }}
      benefits={{
        heading: "Why financial services teams choose Hubbly",
        items: [
          {
            title: "Trust-first messaging",
            description: "AI outreach positions your firm as a strategic advisor. No aggressive sales language that damages credibility.",
          },
          {
            title: "Compliance guardrails",
            description: "Five opt-in approval gates let you review messaging and targeting before anything goes live.",
          },
          {
            title: "High-intent targeting",
            description: "Find prospects actively researching tax strategies, wealth management, or lending — not cold lists of demographics.",
          },
          {
            title: "Consultative voice",
            description: "Voice agents conduct discovery conversations that qualify needs before booking with licensed professionals.",
          },
        ],
      }}
      cta={{
        primary: "Automate financial services sales",
        secondary: "Talk to the team",
      }}
    />
  )
}
