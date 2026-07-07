import type { Metadata } from "next"
import { LandingPageTemplate } from "@/components/landing-page-template"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Autonomous Outbound — From URL to Booked Meeting",
  description:
    "Hubbly runs fully autonomous outbound: signal-based prospecting, multi-channel sequences, and AI voice follow-up that books meetings.",
  path: "/use-cases/autonomous-outbound",
})

export default function AutonomousOutboundPage() {
  return (
    <LandingPageTemplate
      eyebrow="Use Case"
      title="Autonomous Outbound"
      subtitle="Outbound that runs itself — from research to booked meeting."
      description="Hubbly is an autonomous revenue operating system that turns your website and offer into a live outbound engine. It handles research, targeting, copy, multi-channel execution, and booking while you review outcomes instead of operating tools."
      problem={{
        heading: "Why traditional outbound doesn't scale",
        points: [
          "SDRs spend 70% of their time on research, data entry, and tool management instead of conversations.",
          "Sequencing tools don't know what enrichment tools found. Dialers don't know what email sequences said.",
          "Scaling outbound means hiring more reps and buying more seats — costs grow linearly with volume.",
          "Most outbound hits the wrong people because targeting is based on static lists, not live intent signals.",
        ],
      }}
      solution={{
        heading: "How Hubbly runs autonomous outbound",
        points: [
          "Hubbly ingests your website, offer, and market positioning to understand what you sell and who should buy.",
          "It maps your best-fit buyer profile and identifies accounts showing real purchase intent from 40K+ signal topics.",
          "AI writes personalized sequences, sends email, places voice calls, and adapts messaging based on replies.",
          "Meetings book automatically while the system learns from conversions to sharpen future targeting.",
        ],
      }}
      benefits={{
        heading: "What autonomous outbound delivers",
        items: [
          {
            title: "Zero manual research",
            description: "Hubbly researches your market, competitors, and prospects automatically. No more tab switching and spreadsheet assembly.",
          },
          {
            title: "Multi-channel from one system",
            description: "Email and voice work from the same shared memory. When a prospect replies, the voice agent already knows the context.",
          },
          {
            title: "Scales without headcount",
            description: "Increase outbound volume without hiring more SDRs or buying more tool seats. Pay for leads and minutes, not seats.",
          },
          {
            title: "Always improving",
            description: "Every reply, objection, and conversion feeds back into the system so targeting and messaging get sharper over time.",
          },
        ],
      }}
      cta={{
        primary: "Start autonomous outbound",
        secondary: "See a demo",
      }}
    />
  )
}
