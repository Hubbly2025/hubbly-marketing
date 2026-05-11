import type { Metadata } from "next"
import Link from "next/link"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Pricing — Priced Like a Hire, Not a SaaS Seat",
  description: "Hubbly pricing for autonomous outbound, AI voice, and the Business tier with done-for-you Meta ads. Transparent plans built for revenue teams.",
  alternates: { canonical: "https://hubbly.io/pricing" },
}

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Hubbly",
  description: "Autonomous revenue operating system for AI outbound, ICP enrichment, voice and email automation.",
  brand: { "@type": "Brand", name: "Hubbly" },
  offers: [
    { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD", url: "https://hubbly.io/pricing" },
    { "@type": "Offer", name: "Starter", price: "98", priceCurrency: "USD", url: "https://hubbly.io/pricing" },
    { "@type": "Offer", name: "Pro", price: "298", priceCurrency: "USD", url: "https://hubbly.io/pricing" },
    { "@type": "Offer", name: "Business", price: "698", priceCurrency: "USD", url: "https://hubbly.io/pricing" },
    { "@type": "Offer", name: "Agency", price: "1498", priceCurrency: "USD", url: "https://hubbly.io/pricing" },
  ],
}

const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    description: "Try the system with 100 leads and email outreach.",
    features: [
      "100 leads",
      "Email outreach",
      "Daily brief — first 7 days",
    ],
    cta: "Get started free",
    href: "#",
    featured: false,
  },
  {
    name: "Starter",
    price: "$98",
    period: "/mo",
    description: "For solo operators and small teams getting started.",
    features: [
      "500 leads",
      "Email outreach",
      "Daily brief",
      "8 vertical agents",
      "CRM sync",
    ],
    cta: "Start with Starter",
    href: "#",
    featured: false,
  },
  {
    name: "Pro",
    price: "$298",
    period: "/mo",
    description: "Add voice outreach and reputation management.",
    features: [
      "2,000 leads",
      "60 voice minutes",
      "Reputation responses",
      "Priority support",
      "All Starter features",
    ],
    cta: "Go Pro",
    href: "#",
    featured: true,
  },
  {
    name: "Business",
    price: "$698",
    period: "/mo",
    description: "For growth teams running multi-channel campaigns.",
    features: [
      "6,000 leads",
      "200 voice minutes",
      "Acquire — Meta ads",
      "Competitor ad analysis",
      "All Pro features",
    ],
    cta: "Go Business",
    href: "#",
    featured: false,
  },
  {
    name: "Agency",
    price: "$1,498",
    period: "/mo",
    description: "Multi-client management with white-label options.",
    features: [
      "15,000 leads",
      "400 voice minutes",
      "Multi-account",
      "White-label",
      "All Business features",
    ],
    cta: "Go Agency",
    href: "#",
    featured: false,
  },
]

const pricingFaqs = [
  {
    question: "What is included in each lead?",
    answer: "Each lead includes verified contact data, company information, intent signals, and is scored for purchase readiness before entering your pipeline.",
  },
  {
    question: "How are voice minutes counted?",
    answer: "Voice minutes are counted per outbound call second, rounded to the nearest minute. Voicemails count toward usage. Additional voice packs available: $49/100 min, $129/300 min, $299/1,000 min.",
  },
  {
    question: "Can I change plans anytime?",
    answer: "Yes. Upgrade or downgrade anytime from your dashboard. Changes take effect on your next billing cycle. No contracts or commitments.",
  },
  {
    question: "Do you offer annual billing?",
    answer: "Yes. Annual billing saves 20% on all paid plans. Contact sales for annual pricing.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, ACH transfers for Business and Agency plans, and can accommodate invoicing for Enterprise customers.",
  },
  {
    question: "Is there a free trial?",
    answer: "The Free plan gives you 100 leads and email outreach to test the system. No credit card required to start.",
  },
]

const pricingFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: pricingFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
}

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingFaqSchema) }}
      />
      <main className="min-h-screen bg-background">
        <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-12"
        >
          ← Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-16">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent block mb-4">
            PRICING
          </span>
          <h1 className="font-[var(--font-bebas)] text-4xl md:text-6xl lg:text-7xl tracking-tight mb-6">
            Priced like a hire. Not a SaaS seat.
          </h1>
          <p className="max-w-2xl mx-auto font-mono text-sm md:text-base text-muted-foreground">
            A growth officer at $98/month. A growth team at $1,498/month. No contracts. Cancel anytime.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-16">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "flex flex-col p-6 relative",
                tier.featured
                  ? "border-2 border-accent bg-card/50"
                  : "border border-border/50 bg-card/30"
              )}
            >
              {tier.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent px-3 py-1">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-background">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
                {tier.name}
              </span>

              <div className="flex items-baseline gap-1 mb-3">
                <span className="font-[var(--font-bebas)] text-4xl tracking-tight text-accent">
                  {tier.price}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {tier.period}
                </span>
              </div>

              <p className="font-mono text-xs text-muted-foreground mb-4 min-h-[40px]">
                {tier.description}
              </p>

              <div className="h-[1px] w-full bg-border/40 mb-4" />

              <ul className="space-y-2 mb-6 flex-1">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="font-mono text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-accent mt-0.5">+</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href={tier.href}
                className={cn(
                  "inline-flex items-center justify-center px-4 py-3 font-mono text-xs uppercase tracking-widest transition-all duration-200",
                  tier.featured
                    ? "bg-accent text-background hover:bg-accent/90"
                    : "border border-foreground/20 text-foreground hover:border-accent hover:text-accent"
                )}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>

        {/* Unit Economics */}
        <div className="text-center mb-20 space-y-2">
          <p className="font-mono text-xs text-muted-foreground">
            Voice credit packs: $49 / 100 min · $129 / 300 min · $299 / 1,000 min
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            Unit economics at scale: from $0.099/lead and $0.299/voice minute
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            All plans include 8 vertical agents, CRM sync, and email warmup
          </p>
        </div>

        {/* Pricing FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="font-[var(--font-bebas)] text-3xl md:text-4xl tracking-tight mb-8 text-center">
            Pricing Questions
          </h2>
          <div className="space-y-4">
            {pricingFaqs.map((faq, index) => (
              <div key={index} className="border border-border/50 bg-card/30 p-5 md:p-6">
                <h3 className="font-mono text-sm text-foreground mb-2">
                  {faq.question}
                </h3>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16 pt-16 border-t border-border/30">
          <h2 className="font-[var(--font-bebas)] text-2xl md:text-3xl tracking-tight mb-4">
            Not sure which plan fits?
          </h2>
          <p className="font-mono text-sm text-muted-foreground mb-6">
            Book a demo and we will walk through your use case.
          </p>
          <a
            href="https://cal.com/hubbly/demo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-accent px-6 py-3 font-mono text-xs uppercase tracking-widest text-background hover:bg-accent/90 transition-all duration-200"
          >
            Book a Demo →
          </a>
          </div>
        </div>
      </main>
    </>
  )
}
