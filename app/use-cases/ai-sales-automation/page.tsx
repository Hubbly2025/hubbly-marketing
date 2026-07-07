import type { Metadata } from "next"
import { LandingPageTemplate } from "@/components/landing-page-template"

export const metadata: Metadata = {
  title: "AI Sales Automation — Replace Your Outbound Stack",
  description: "Use Hubbly to automate the full sales motion: research, ICP, enrichment, email, voice, and booked meetings — from one URL.",
  alternates: { canonical: "https://hubbly.io/use-cases/ai-sales-automation" },
}

export default function AISalesAutomationPage() {
  return (
    <LandingPageTemplate
      eyebrow="Use Case"
      title="AI Sales Automation"
      subtitle="Automate research, outreach, and booking with specialized agents that share one operating memory."
      description="Hubbly is an Autonomous Revenue OS that combines AI-powered research, ICP building, enrichment, multi-channel outreach, voice calls, and meeting booking in one system. It replaces the fragmented stack of point solutions most teams stitch together."
      problem={{
        heading: "The problem with current sales automation",
        points: [
          "Most AI sales tools only handle one piece of the workflow — you still need to connect lead data, enrichment, sequencing, dialers, and booking tools manually.",
          "Data drifts between systems because each tool has its own database with no shared memory.",
          "Teams spend more time operating tools than actually selling.",
          "Scaling means adding more tools and more complexity, not more pipeline.",
        ],
      }}
      solution={{
        heading: "How Hubbly automates sales end-to-end",
        points: [
          "Hubbly analyzes your business, maps your ideal buyer profile, and builds targeting logic automatically.",
          "It enriches contacts from 498M+ intent-qualified records and scores them using 43K+ live buyer signals.",
          "AI writes personalized outreach, sends email sequences, places voice calls, and handles replies.",
          "Meetings book directly to your calendar while conversion patterns feed back into the system to improve targeting.",
        ],
      }}
      benefits={{
        heading: "Why teams choose Hubbly for AI sales automation",
        items: [
          {
            title: "One system, not ten tools",
            description: "Replace Apollo, Clay, Instantly, Smartlead, Aircall, and Calendly with a single operating system that shares memory across all functions.",
          },
          {
            title: "Human oversight built in",
            description: "Five approval gates between intelligence and execution. You review the ICP, strategy, and creative before anything goes live.",
          },
          {
            title: "Voice AI included",
            description: "Unlike email-only automation, Hubbly places AI voice calls that adapt to conversation context in real time.",
          },
          {
            title: "Live in 15 minutes",
            description: "Drop your website URL and get an active campaign running. No weeks of integration or API configuration required.",
          },
        ],
      }}
      cta={{
        primary: "Start free",
        secondary: "See how it works",
      }}
    />
  )
}
