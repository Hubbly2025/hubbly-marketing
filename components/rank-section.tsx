"use client"

import { useRef, useEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const cards = [
  {
    title: "The honesty gate",
    description:
      "Every factual claim is verified before publish. Anything self-labeled routes to human review — no hallucinated content ships under your brand.",
    highlight: true,
  },
  {
    title: "Multi-engine citation",
    description:
      'Citation in AI engines tracked as a hard number, next to Google rank. "See your content in ChatGPT" — not just "rank higher."',
  },
  {
    title: "Closed verified loop",
    description:
      "Snapshot before every change, verify after every publish, auto-rollback on regression. Rails are always on.",
  },
  {
    title: "No sales gate",
    description: "Self-serve from your first audit. No demos, no negotiation, no sales call to get started.",
  },
]

export function RankSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

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

      if (cardsRef.current) {
        gsap.from(cardsRef.current.querySelectorAll(".rank-card"), {
          y: 40,
          opacity: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="rank"
      className="relative py-24 md:py-32 px-4 md:pl-28 md:pr-12 border-t border-border/30"
    >
      <div ref={headerRef} className="mb-12 md:mb-16 max-w-3xl">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-rank">Hubbly Rank · The wedge</span>
        <h2 className="mt-4 md:mt-6 font-[var(--font-bebas)] text-4xl md:text-7xl tracking-tight text-balance">
          Search is splitting. Rank wins both.
        </h2>
        <p className="mt-6 font-mono text-sm md:text-base text-muted-foreground leading-relaxed">
          Buyers now ask ChatGPT, Perplexity, and Google. SEO tools optimize for one engine and take your word for the
          content. Rank publishes for all of them — and doesn&apos;t trust itself.
        </p>
      </div>

      <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-5xl">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`rank-card border bg-card/30 p-6 md:p-8 transition-all duration-300 ${
              card.highlight ? "border-accent" : "border-border/50 hover:border-accent/60"
            }`}
          >
            <h3 className="font-[var(--font-bebas)] text-2xl md:text-3xl tracking-tight mb-3 md:mb-4 text-accent">
              {card.title}
            </h3>
            <p className="font-mono text-xs md:text-sm text-muted-foreground leading-relaxed">{card.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 max-w-5xl">
        <a
          href="#how-it-works"
          className="font-mono text-[11px] md:text-xs uppercase tracking-widest text-foreground/60 hover:text-foreground transition-colors duration-200"
        >
          Watch Rank publish with the rails on →
        </a>
      </div>

      <div className="mt-10 border-l-2 border-accent pl-6 max-w-3xl">
        <p className="font-mono text-sm md:text-base text-accent leading-relaxed">
          Competitors sell sales-gated SEO dashboards. Rank ships verified content and proves the citation.
        </p>
      </div>
    </section>
  )
}
