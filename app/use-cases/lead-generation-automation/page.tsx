import type { Metadata } from "next"
import { LandingPageTemplate } from "@/components/landing-page-template"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Lead Generation Automation — Signal Over Spray",
  description:
    "Hubbly automates lead generation with real-time signal detection, ICP enrichment, and multi-channel outreach across email and voice.",
  path: "/use-cases/lead-generation-automation",
})

export default function LeadGenerationAutomationPage() {
  return (
    <LandingPageTemplate
      eyebrow="Use Case"
      title="Lead Generation Automation"
      subtitle="Find and qualify leads automatically using 498M+ records and 40K+ intent topics."
      description="Hubbly is an autonomous revenue operating system that automates lead generation from discovery through qualification. It finds verified buyers, enriches contact data, scores purchase intent, and delivers qualified leads to your pipeline without manual list building."
      problem={{
        heading: "The lead generation bottleneck",
        points: [
          "Manual list building takes hours and delivers stale, unverified data that bounces or goes unanswered.",
          "Lead vendors sell the same lists to everyone — by the time you reach out, prospects are already saturated.",
          "Enrichment tools require separate subscriptions and manual data matching that breaks at scale.",
          "Without intent signals, you're guessing which leads are actually in-market to buy.",
        ],
      }}
      solution={{
        heading: "How Hubbly automates lead generation",
        points: [
          "Hubbly builds your ideal customer profile from your website, offer, and market positioning.",
          "It searches 498M+ identity records to find contacts that match your ICP and show active buying signals.",
          "Every lead is verified, enriched with contact data, and scored for purchase intent before entering your pipeline.",
          "Qualified leads flow directly into outreach sequences or your CRM — no CSV exports or manual handoffs.",
        ],
      }}
      benefits={{
        heading: "What automated lead generation delivers",
        items: [
          {
            title: "Verified, not guessed",
            description: "Every lead is verified against multiple sources before it reaches your pipeline. No bounces, no fake emails, no wasted effort.",
          },
          {
            title: "Intent-scored for priority",
            description: "40K+ live intent topics identify which leads are actively researching solutions in your category right now.",
          },
          {
            title: "Enriched automatically",
            description: "Contact data, company info, and technographics are enriched without separate tools or manual matching.",
          },
          {
            title: "Flows into execution",
            description: "Leads don't stop at a spreadsheet. They flow directly into Hubbly's outreach and voice agents for immediate action.",
          },
        ],
      }}
      cta={{
        primary: "Automate lead generation",
        secondary: "Book a demo",
      }}
    />
  )
}
