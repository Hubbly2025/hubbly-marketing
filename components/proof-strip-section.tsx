"use client"

import { useRef, useEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const stats = [
  { number: "498M", label: "Intent-qualified records" },
  { number: "43K+", label: "Live buyer intent topics" },
  { number: "8 execution agents", label: "Executing in coordinated sequence" },
  { number: "5 intelligence agents", label: "Researching + strategizing upstream" },
  { number: "Under 15 min", label: "URL to active campaign" },
  { number: "1 system", label: "Replacing your agency + stack" },
]

export function ProofStripSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)

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

      if (statsRef.current) {
        const items = statsRef.current.querySelectorAll(":scope > div")
        gsap.from(items, {
          y: 40,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: statsRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="proof-strip" className="relative py-20 md:py-24 px-4 md:pl-28 md:pr-12 border-t border-border/30">
      <div ref={headerRef} className="mb-10 md:mb-12">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">02 / PROBLEM</span>
        <h2 className="mt-4 md:mt-6 font-[var(--font-bebas)] text-4xl md:text-5xl tracking-tight">The numbers that matter.</h2>
        <p className="mt-4 font-mono text-sm text-muted-foreground max-w-2xl">
          Every number is measurable, reproducible, and verified against real customer pipelines.
        </p>
      </div>

      <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 md:gap-10">
        {stats.map((stat, index) => (
          <div key={index} className="text-left">
            <div className="font-[var(--font-bebas)] text-2xl md:text-3xl tracking-tight text-accent mb-2">
              {stat.number}
            </div>
            <p className="font-mono text-[10px] text-muted-foreground leading-relaxed uppercase tracking-wide">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
