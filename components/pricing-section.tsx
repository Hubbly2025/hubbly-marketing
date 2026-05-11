"use client"

import { useRef, useEffect, memo } from "react"
import { cn } from "@/lib/utils"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    features: [
      "100 leads",
      "Email outreach",
      "Daily brief — first 7 days",
    ],
    cta: "Get started →",
    href: "/signup?plan=free",
    featured: false,
  },
  {
    name: "Starter",
    price: "$98",
    period: "/mo",
    features: [
      "500 leads",
      "Email outreach",
      "Daily brief",
      "8 vertical agents",
    ],
    cta: "Start with Starter →",
    href: "/signup?plan=starter",
    featured: false,
  },
  {
    name: "Pro",
    price: "$298",
    period: "/mo",
    features: [
      "2,000 leads",
      "60 voice minutes",
      "Reputation responses",
      "All Starter features",
    ],
    cta: "Go Pro →",
    href: "/signup?plan=pro",
    featured: true,
  },
  {
    name: "Business",
    price: "$698",
    period: "/mo",
    features: [
      "6,000 leads",
      "200 voice minutes",
      "Acquire — Meta ads",
      "Competitor ad analysis",
      "All Pro features",
    ],
    cta: "Go Business →",
    href: "/signup?plan=business",
    featured: false,
  },
  {
    name: "Agency",
    price: "$1,498",
    period: "/mo",
    features: [
      "15,000 leads",
      "400 voice minutes",
      "Multi-account",
      "White-label",
      "All Business features",
    ],
    cta: "Go Agency →",
    href: "/signup?plan=agency",
    featured: false,
  },
]

export function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.from(headerRef.current, {
          x: -60,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        })
      }

      if (gridRef.current) {
        const items = gridRef.current.querySelectorAll(":scope > div")
        gsap.from(items, {
          y: 40,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="pricing" className="relative py-24 md:py-32 px-4 md:pl-28 md:pr-12 border-t border-border/30">
      <div ref={headerRef} className="mb-12 md:mb-16">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">11 / PRICING</span>
        <h2 className="mt-4 md:mt-6 font-[var(--font-bebas)] text-4xl md:text-7xl tracking-tight">
          Priced like a hire. Not a SaaS seat.
        </h2>
        <p className="mt-3 md:mt-4 font-mono text-sm text-muted-foreground max-w-2xl">
          A growth officer at $98/month. A growth team at $1,498/month. Cancel anytime.
        </p>
      </div>

      <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        {pricingTiers.map((tier) => (
          <div
            key={tier.name}
            className={cn(
              "flex flex-col p-5 md:p-6 relative",
              tier.featured
                ? "border-2 border-accent bg-card/50"
                : "border border-border/50 bg-card/30"
            )}
          >
            {tier.featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent px-3 py-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-background">MOST POPULAR</span>
              </div>
            )}
            
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
              {tier.name}
            </span>
            
            <div className="flex items-baseline gap-1 mb-4">
              <span className="font-[var(--font-bebas)] text-3xl md:text-4xl tracking-tight text-accent">
                {tier.price}
              </span>
              <span className="font-mono text-xs text-muted-foreground">{tier.period}</span>
            </div>

            <div className="h-[1px] w-full bg-border/40 mb-4" />

            <ul className="space-y-2 mb-6 flex-1">
              {tier.features.map((feature, idx) => (
                <li key={idx} className="font-mono text-xs text-muted-foreground">
                  {feature}
                </li>
              ))}
            </ul>

            <div className="h-[1px] w-full bg-border/40 mb-4" />

            <a
              href={tier.href}
              className={cn(
                "inline-flex items-center justify-center px-4 py-3 font-mono text-[10px] md:text-xs uppercase tracking-widest transition-all duration-200",
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

      <div className="mt-10 md:mt-12 space-y-2 text-center">
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
    </section>
  )
}
