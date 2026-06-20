import type { Metadata } from "next"
import dynamic from "next/dynamic"
import { HeroSection } from "@/components/hero-section"
import { ProofStripSection } from "@/components/proof-strip-section"
import { SideNav } from "@/components/side-nav"
import { TickerTape } from "@/components/ticker-tape"
import { StickyHeader } from "@/components/sticky-header"
import { FloatingCTA } from "@/components/floating-cta"

// Below-the-fold sections are code-split into separate client chunks.
// SSR stays enabled (default) so the marketing copy remains in the HTML for SEO.
const EngineSection = dynamic(() => import("@/components/engine-section").then((m) => m.EngineSection))
const HowItWorksSection = dynamic(() =>
  import("@/components/how-it-works-section").then((m) => m.HowItWorksSection),
)
const WhyItWinsSection = dynamic(() => import("@/components/why-it-wins-section").then((m) => m.WhyItWinsSection))
const StackReplacementSection = dynamic(() =>
  import("@/components/stack-replacement-section").then((m) => m.StackReplacementSection),
)
const AcquireSection = dynamic(() => import("@/components/acquire-section").then((m) => m.AcquireSection))
const VerticalsSection = dynamic(() => import("@/components/verticals-section").then((m) => m.VerticalsSection))
const UseCasesSection = dynamic(() => import("@/components/use-cases-section").then((m) => m.UseCasesSection))
const SocialProofSection = dynamic(() => import("@/components/social-proof-section").then((m) => m.SocialProofSection))
const FAQSection = dynamic(() => import("@/components/faq-section").then((m) => m.FAQSection))
const FinalCloseSection = dynamic(() => import("@/components/final-close-section").then((m) => m.FinalCloseSection))
const FooterSection = dynamic(() => import("@/components/footer-section").then((m) => m.FooterSection))

export const metadata: Metadata = {
  title: "Hubbly — Autonomous Growth Engine",
  description:
    "Drop your website in and Hubbly goes to work — analyzing your business, mapping your market, building campaigns, running outreach, placing calls, and booking meetings. 12 agents. 3 layers. 1 autonomous growth engine.",
  alternates: { canonical: "https://hubbly.io/" },
}

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Hubbly",
  url: "https://hubbly.io",
  logo: "https://hubbly.io/og/hubbly-logo.png",
  sameAs: [
    "https://twitter.com/hubblyio",
    "https://www.linkedin.com/company/hubbly-io",
  ],
}

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Hubbly",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Autonomous growth engine with 12 AI agents organized in 3 layers (Understand, Execute, Improve) for ICP enrichment, autonomous outbound, AI voice calling, email sequencing, and booked meetings.",
}

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  url: "https://hubbly.io",
  name: "Hubbly",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://hubbly.io/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Hubbly?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hubbly is an autonomous growth engine. You drop in your website and Hubbly learns what you sell, who your best customers are, and what messages should move the market. Then its 12 agents turn that intelligence into action.",
      },
    },
    {
      "@type": "Question",
      name: "How is Hubbly organized?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hubbly uses 12 agents organized in 3 layers: Understand (Recon, ICP, Strategy), Execute (Scout, Score, Writer, Sender, Voice, Booker), and Improve (Track, Optimize, Advisor). All agents share one operating memory.",
      },
    },
  ],
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <main className="relative min-h-screen">
        <StickyHeader withTicker />
        <SideNav />
        <FloatingCTA />
        <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />

        <div className="relative z-10">
          <TickerTape />
          <HeroSection />
          <ProofStripSection />
          <EngineSection />
          <HowItWorksSection />
          <WhyItWinsSection />
          <StackReplacementSection />
          <AcquireSection />
          <VerticalsSection />
          <UseCasesSection />
          <SocialProofSection />
          <FAQSection />
          <FinalCloseSection />
          <FooterSection />
        </div>
      </main>
    </>
  )
}
