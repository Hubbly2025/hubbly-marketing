"use client"

import { useRef, useEffect } from "react"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

interface LandingPageProps {
  eyebrow: string
  title: string
  subtitle: string
  description: string
  problem: {
    heading: string
    points: string[]
  }
  solution: {
    heading: string
    points: string[]
  }
  benefits: {
    heading: string
    items: { title: string; description: string }[]
  }
  cta: {
    primary: string
    secondary: string
  }
}

export function LandingPageTemplate({
  eyebrow,
  title,
  subtitle,
  description,
  problem,
  solution,
  benefits,
  cta,
}: LandingPageProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!contentRef.current) return

    const ctx = gsap.context(() => {
      gsap.from(".animate-in", {
        y: 30,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: "power3.out",
      })
    }, contentRef)

    return () => ctx.revert()
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />

      <div ref={contentRef} className="relative z-10 max-w-5xl mx-auto px-6 py-24 md:py-32">
        <Link
          href="/"
          className="animate-in inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-12"
        >
          ← Back to Hubbly
        </Link>

        {/* Hero */}
        <div className="animate-in mb-16 md:mb-24">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent block mb-4">
            {eyebrow}
          </span>
          <h1 className="font-[var(--font-bebas)] text-4xl md:text-6xl lg:text-7xl tracking-tight mb-6 text-balance">
            {title}
          </h1>
          <p className="font-mono text-lg md:text-xl text-accent mb-6">
            {subtitle}
          </p>
          <p className="font-mono text-sm md:text-base text-foreground/80 leading-relaxed max-w-3xl">
            {description}
          </p>
        </div>

        {/* Problem */}
        <section className="animate-in mb-16 md:mb-24">
          <h2 className="font-[var(--font-bebas)] text-2xl md:text-4xl tracking-tight mb-6">
            {problem.heading}
          </h2>
          <ul className="space-y-3">
            {problem.points.map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-accent mt-1">—</span>
                <span className="font-mono text-sm text-muted-foreground leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Solution */}
        <section className="animate-in mb-16 md:mb-24 border-l-2 border-accent pl-6 md:pl-8">
          <h2 className="font-[var(--font-bebas)] text-2xl md:text-4xl tracking-tight mb-6">
            {solution.heading}
          </h2>
          <ul className="space-y-3">
            {solution.points.map((point, i) => (
              <li key={i} className="font-mono text-sm text-foreground/80 leading-relaxed">
                {point}
              </li>
            ))}
          </ul>
        </section>

        {/* Benefits */}
        <section className="animate-in mb-16 md:mb-24">
          <h2 className="font-[var(--font-bebas)] text-2xl md:text-4xl tracking-tight mb-8">
            {benefits.heading}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.items.map((item, i) => (
              <div key={i} className="border border-border/50 bg-card/30 p-6">
                <h3 className="font-mono text-sm text-accent uppercase tracking-widest mb-3">
                  {item.title}
                </h3>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="animate-in border-t border-border/30 pt-12 md:pt-16">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Link
              href="/#audit"
              className="inline-flex items-center gap-3 bg-accent px-6 py-4 font-mono text-xs uppercase tracking-widest text-background hover:bg-accent/90 transition-all duration-200"
            >
              {cta.primary}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </Link>
            <Link
              href="https://cal.com/hubbly/demo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-border/50 px-6 py-4 font-mono text-xs uppercase tracking-widest text-foreground/70 hover:text-foreground hover:border-border transition-all duration-200"
            >
              {cta.secondary} →
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
