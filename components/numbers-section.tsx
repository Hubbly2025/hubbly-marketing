"use client"

import { useRef, useEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const stats = [
  { number: "498,000,000", label: "records available" },
  { number: "43,000+", label: "live intent topics" },
  { number: "22%", label: "average visitor identification rate" },
  { number: "30 seconds", label: "to first qualified lead" },
  { number: "Under 10 min", label: "to go live" },
  { number: "1 system", label: "replacing the modern outbound stack" },
  { number: "24/7", label: "coordinated outreach coverage" },
]

export function NumbersSection() {
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
    <section ref={sectionRef} id="numbers" className="relative py-24 md:py-32 px-4 md:pl-28 md:pr-12 border-t border-border/30">
      <div ref={headerRef} className="mb-12 md:mb-16">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">10 / THE NUMBERS</span>
        <h2 className="mt-4 md:mt-6 font-[var(--font-bebas)] text-4xl md:text-7xl tracking-tight">
          Built on signal. Measured by output.
        </h2>
      </div>

      <div ref={statsRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-8 md:gap-10">
        {stats.map((stat, index) => (
          <div key={index} className="text-left">
            <div className="font-[var(--font-bebas)] text-xl md:text-3xl tracking-tight text-accent mb-1 md:mb-2">
              {stat.number}
            </div>
            <p className="font-mono text-[9px] md:text-[10px] text-muted-foreground leading-relaxed uppercase tracking-wide">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
