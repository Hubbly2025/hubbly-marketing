import type { Metadata } from "next"
import { StickyHeader } from "@/components/sticky-header"
import { FooterSection } from "@/components/footer-section"

export const metadata: Metadata = {
  title: "Pricing — Hubbly",
  description:
    "Simple, transparent pricing for Hubbly. Start free with a revenue audit, then scale from resolved leads to full autopilot, outbound voice, and agency multi-seat.",
  alternates: { canonical: "https://hubbly.io/pricing" },
}

type Tier = {
  name: string
  price: string
  cadence: string
  includes: string
  cta: string
  href: string
  popular?: boolean
}

const tiers: Tier[] = [
  {
    name: "Free",
    price: "$0",
    cadence: "/mo",
    includes: "100 resolved leads/mo · free audit · pixel",
    cta: "Run free audit",
    href: "/#audit",
  },
  {
    name: "Signal",
    price: "$98",
    cadence: "/mo",
    includes: "250 resolved leads/mo · identity + intent data layer",
    cta: "Run free audit",
    href: "/#audit",
  },
  {
    name: "Pro",
    price: "$298",
    cadence: "/mo",
    includes: "1,000 resolved leads/mo · full pipeline",
    cta: "Run free audit",
    href: "/#audit",
  },
  {
    name: "Autopilot",
    price: "$498",
    cadence: "/mo",
    includes: "Everything in Pro + Rank SEO/AEO on autopilot",
    cta: "Run free audit",
    href: "/#audit",
    popular: true,
  },
  {
    name: "Workforce",
    price: "$995",
    cadence: "/mo",
    includes: "Everything in Autopilot + outbound voice + AI SDRs",
    cta: "Run free audit",
    href: "/#audit",
  },
  {
    name: "Agency",
    price: "$2,500+",
    cadence: "/mo",
    includes: "Multi-seat · white-label · custom",
    cta: "Talk to us",
    href: "mailto:hello@hubbly.io",
  },
]

export default function PricingPage() {
  return (
    <main className="relative min-h-screen">
      <StickyHeader />
      <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />

      <div className="relative z-10">
        <section className="px-4 md:pl-28 md:pr-12 pt-28 md:pt-36 pb-16 md:pb-24">
          {/* Header */}
          <div className="mb-12 md:mb-16 max-w-3xl">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Pricing</span>
            <h1 className="mt-4 md:mt-6 font-[var(--font-bebas)] text-4xl md:text-6xl tracking-tight text-balance">
              One system. Priced to scale with your pipeline.
            </h1>
            <p className="mt-4 font-mono text-sm md:text-base text-muted-foreground leading-relaxed">
              Start free with a revenue audit, then grow from resolved leads into full autopilot, outbound voice, and
              multi-seat agency deployments.
            </p>
          </div>

          {/* Pricing grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4 md:gap-5">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col border bg-card/30 p-6 transition-all duration-300 ${
                  tier.popular ? "border-accent" : "border-border/50 hover:border-accent/60"
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-3 left-6 bg-accent px-3 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-background">
                    Most popular
                  </span>
                )}

                <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{tier.name}</h2>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-[var(--font-bebas)] text-4xl md:text-5xl tracking-tight text-foreground">
                    {tier.price}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{tier.cadence}</span>
                </div>

                <p className="mt-4 font-mono text-xs text-muted-foreground leading-relaxed flex-1">{tier.includes}</p>

                <a
                  href={tier.href}
                  className={`mt-6 inline-flex min-h-[44px] items-center justify-center px-4 font-mono text-[11px] uppercase tracking-widest transition-colors duration-200 ${
                    tier.popular
                      ? "bg-accent text-background hover:bg-accent/90"
                      : "border border-border/60 text-foreground hover:border-accent hover:text-accent"
                  }`}
                >
                  {tier.cta}
                </a>
              </div>
            ))}
          </div>

          {/* Under-grid note */}
          <p className="mt-8 md:mt-10 font-mono text-xs md:text-sm text-muted-foreground">
            14-day trial, uncapped. No credit card required to run the audit.
          </p>
        </section>

        <FooterSection />
      </div>
    </main>
  )
}
