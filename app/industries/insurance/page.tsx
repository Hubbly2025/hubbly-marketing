import type { Metadata } from "next"
import { LandingPageTemplate } from "@/components/landing-page-template"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "AI for Insurance Lead Generation & Outreach",
  description:
    "Hubbly for insurance agencies and carriers: signal-based prospecting, enrichment, and AI voice + email that books policy reviews.",
  path: "/industries/insurance",
})

export default function InsuranceIndustryPage() {
  return (
    <LandingPageTemplate
      eyebrow="Industry"
      title="Insurance Sales Automation"
      subtitle="AI agents built for life insurance, commercial insurance, and benefits teams."
      description="Hubbly provides specialized AI agents for insurance sales teams. Riley handles life insurance. Jordan handles commercial insurance. Both understand policy language, compliance requirements, and the consultative sales process that insurance requires."
      problem={{
        heading: "Insurance sales challenges",
        points: [
          "Insurance sales require consultative conversations — generic AI tools don't understand policy language or compliance needs.",
          "Lead vendors sell the same aged leads to multiple agents, creating a race to the bottom on contact speed.",
          "TCPA and DNC compliance add friction that generic outbound tools don't handle well.",
          "Most automation breaks at the voice call — insurance still requires phone conversations to close.",
        ],
      }}
      solution={{
        heading: "How Hubbly serves insurance teams",
        points: [
          "Riley and Jordan are vertical-specific AI agents trained on insurance terminology, objections, and sales workflows.",
          "Hubbly finds in-market insurance buyers showing intent signals like policy research, life event changes, and coverage comparison.",
          "TCPA-compliant consent language, DNC scrubbing, and TrustedForm certificates are built into the system.",
          "AI voice agents handle the first conversation, qualify interest, and book appointments for licensed agents.",
        ],
      }}
      benefits={{
        heading: "Why insurance teams choose Hubbly",
        items: [
          {
            title: "Vertical-specific agents",
            description: "Riley (life insurance) and Jordan (commercial) understand policy language, common objections, and compliance requirements.",
          },
          {
            title: "Compliance built in",
            description: "TCPA consent, DNC scrubbing, and TrustedForm certificates are system properties — not checklists you maintain manually.",
          },
          {
            title: "Voice-first approach",
            description: "Insurance requires conversations. Hubbly's voice agents handle qualification calls and book appointments for closers.",
          },
          {
            title: "Intent-based targeting",
            description: "Find buyers actively researching coverage, comparing policies, or experiencing life events that trigger insurance needs.",
          },
        ],
      }}
      cta={{
        primary: "Automate insurance sales",
        secondary: "Talk to the team",
      }}
    />
  )
}
