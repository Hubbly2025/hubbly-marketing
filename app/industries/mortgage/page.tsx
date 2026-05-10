import type { Metadata } from "next"
import { LandingPageTemplate } from "@/components/landing-page-template"

export const metadata: Metadata = {
  title: "AI for Mortgage Lead Generation & Outreach",
  description: "Hubbly for mortgage: detect intent signals, enrich borrowers, and run compliant AI email and voice outreach that books real calls.",
  alternates: { canonical: "https://hubbly.io/industries/mortgage" },
}

export default function MortgageIndustryPage() {
  return (
    <LandingPageTemplate
      eyebrow="Industry"
      title="Mortgage Lead Generation & Automation"
      subtitle="AI agents built for residential lending, refinancing, and home equity teams."
      description="Hubbly provides Taylor, a specialized AI agent for mortgage sales teams. Taylor understands loan products, rate discussions, pre-qualification workflows, and the timing-sensitive nature of mortgage sales where speed-to-contact determines close rates."
      problem={{
        heading: "Mortgage sales challenges",
        points: [
          "Mortgage is timing-sensitive — by the time you work a lead from a vendor, they've already talked to three other lenders.",
          "Rate shoppers require immediate response and consultative conversation about loan options.",
          "Compliance requirements (RESPA, TRID, fair lending) add complexity that generic tools don't handle.",
          "Refinance and purchase intent signals are hard to capture — most targeting relies on stale demographic data.",
        ],
      }}
      solution={{
        heading: "How Hubbly serves mortgage teams",
        points: [
          "Taylor is a vertical-specific AI agent trained on loan products, rate discussions, and pre-qualification conversations.",
          "Hubbly identifies in-market mortgage buyers from intent signals: home search activity, rate comparison, pre-approval research.",
          "Immediate multi-channel outreach (email + voice) contacts prospects before competitors reach them.",
          "AI voice agents pre-qualify borrowers on income, credit range, and timeline before booking with loan officers.",
        ],
      }}
      benefits={{
        heading: "Why mortgage teams choose Hubbly",
        items: [
          {
            title: "Speed to contact",
            description: "Hubbly contacts prospects within minutes of intent signal detection — before they've submitted applications elsewhere.",
          },
          {
            title: "Pre-qualification built in",
            description: "Voice agents gather income, credit, and timeline information so loan officers only talk to qualified borrowers.",
          },
          {
            title: "Purchase and refi signals",
            description: "Identify both home purchase intent (home search, moving signals) and refinance intent (rate comparison, equity research).",
          },
          {
            title: "Compliant by design",
            description: "Fair lending language, TCPA compliance, and proper disclosures are built into every touchpoint.",
          },
        ],
      }}
      cta={{
        primary: "Automate mortgage sales",
        secondary: "Book a demo",
      }}
    />
  )
}
