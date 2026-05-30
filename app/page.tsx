import type { Metadata } from "next"
import { HeroSection } from "@/components/hero-section"
import { ProofStripSection } from "@/components/proof-strip-section"
import { EngineSection } from "@/components/engine-section"
import { HowItWorksSection } from "@/components/how-it-works-section"
import { ModulesSection } from "@/components/modules-section"
import { WhyItWinsSection } from "@/components/why-it-wins-section"
import { StackReplacementSection } from "@/components/stack-replacement-section"
import { AcquireSection } from "@/components/acquire-section"
import { VerticalsSection } from "@/components/verticals-section"
import { UseCasesSection } from "@/components/use-cases-section"
import { PricingSection } from "@/components/pricing-section"
import { SocialProofSection } from "@/components/social-proof-section"
import { FAQSection } from "@/components/faq-section"
import { FinalCloseSection } from "@/components/final-close-section"
import { FooterSection } from "@/components/footer-section"
import { SideNav } from "@/components/side-nav"
import { TickerTape } from "@/components/ticker-tape"

export const metadata: Metadata = {
  title: "Hubbly — Autonomous Revenue Operating System",
  description:
    "Drop your URL. Hubbly goes to work — finding customers, analyzing competitors, writing ads and email, running outreach, placing voice calls, and booking meetings.",
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
    "Autonomous revenue operating system with 12 AI agents for ICP enrichment, autonomous outbound, AI voice calling, email sequencing, Meta ads, and booked meetings.",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: "0",
    highPrice: "1498",
    offerCount: 5,
  },
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
        text: "Hubbly is an autonomous revenue operating system. Drop in your URL and Hubbly goes to work — finding your customers, analyzing competitors, writing ads and email, running outreach, placing voice calls, and booking meetings.",
      },
    },
    {
      "@type": "Question",
      name: "Is Hubbly an AI SDR platform?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hubbly includes AI SDR capabilities and goes further with ICP enrichment, voice agents, Meta ads, and CRM sync in one shared memory.",
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
        <SideNav />
        <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />

        <div className="relative z-10">
          <TickerTape />
          <HeroSection />
          <ProofStripSection />
          <EngineSection />
          <HowItWorksSection />
          <ModulesSection />
          <WhyItWinsSection />
          <StackReplacementSection />
          <AcquireSection />
          <VerticalsSection />
          <UseCasesSection />
          <PricingSection />
          <SocialProofSection />
          <FAQSection />
          <FinalCloseSection />
          <FooterSection />
        </div>
      </main>
    </>
  )
}
