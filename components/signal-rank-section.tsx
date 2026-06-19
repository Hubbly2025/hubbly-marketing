"use client"

import { useRef, useEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const steps = [
  {
    number: "01",
    title: "Analyzes your site & competitors",
    description:
      "Signal Rank crawls your pages and your rivals' — mapping structure, content, and the terms moving your market.",
  },
  {
    number: "02",
    title: "Maps keyword & ranking gaps",
    description:
      "It scores the searches your buyers actually run, then shows exactly where you rank and where demand is walking to competitors.",
  },
  {
    number: "03",
    title: "Ships approved SEO moves automatically",
    description:
      "Technical fixes, content, and on-page changes are queued, sent for your approval, then applied — and tracked as rankings climb.",
  },
]

export function SignalRankSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

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

      if (stepsRef.current) {
        gsap.from(stepsRef.current.querySelectorAll(".rank-step"), {
          y: 40,
          opacity: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: stepsRef.current,
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
      id="signal-rank"
      className="relative py-24 md:py-32 px-4 md:pl-28 md:pr-12 border-t border-border/30"
    >
      {/* Human-in-the-loop trust cue */}
      <div className="mb-12 md:mb-16 border-l-2 border-accent pl-4 md:pl-6 max-w-3xl">
        <p className="font-mono text-xs md:text-sm text-foreground uppercase tracking-widest">
          Human-in-the-loop. Nothing ships without your approval.
        </p>
      </div>

      <div ref={headerRef} className="mb-12 md:mb-16 max-w-4xl">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
          09 / SIGNAL RANK
        </span>
        <h2 className="mt-4 md:mt-6 font-[var(--font-bebas)] text-5xl md:text-8xl tracking-tight">
          Signal Rank
        </h2>
        <p className="mt-4 md:mt-6 font-mono text-base md:text-xl text-accent tracking-wide">
          SEO on autopilot. You approve, it climbs.
        </p>
        <p className="mt-4 max-w-2xl font-mono text-sm text-muted-foreground leading-relaxed">
          The SEO and competitor-analysis agent in the Signal family. It finds the demand you&apos;re not ranking
          for, builds the plan to win it, and ships the work once you sign off.
        </p>
      </div>

      {/* 3-step flow */}
      <div ref={stepsRef} className="grid gap-4 md:gap-6 md:grid-cols-3">
        {steps.map((step) => (
          <div
            key={step.number}
            className="rank-step group relative border border-border/40 p-6 md:p-8 flex flex-col transition-colors duration-300 hover:border-accent/60"
          >
            <span className="font-mono text-xs text-accent tracking-widest">{step.number}</span>
            <h3 className="mt-4 font-[var(--font-bebas)] text-2xl md:text-3xl tracking-tight text-foreground">
              {step.title}
            </h3>
            <p className="mt-3 font-mono text-sm text-foreground/70 leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      {/* Secondary audit CTA — routes to the same free-audit flow */}
      <div className="mt-12 md:mt-16 flex flex-col sm:flex-row items-center gap-4">
        <a
          href="#audit"
          className="group inline-flex items-center justify-center gap-3 bg-accent px-6 py-4 font-mono text-xs md:text-sm uppercase tracking-widest text-background hover:bg-accent/90 transition-colors duration-200 min-h-[48px]"
        >
          See where Signal would rank you
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M7 17L17 7M17 7H7M17 7V17" />
          </svg>
        </a>
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Free · No credit card · ~60 seconds
        </span>
      </div>
    </section>
  )
}
