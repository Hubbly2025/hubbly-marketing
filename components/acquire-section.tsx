"use client"

import { useRef, useEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const features = [
  {
    title: "Built on Creative",
    description: "Approved creative flows directly into paid campaigns without breaking context or introducing another team handoff.",
  },
  {
    title: "Compliant by default",
    description: "Consent language, scrubbing, certificates, and tracking controls are built into the workflow rather than managed as separate process debt.",
  },
  {
    title: "One pipeline",
    description: "Every paid lead enters the same memory, scoring, follow-up, and booking system as outbound.",
  },
]

export function AcquireSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)

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

      if (featuresRef.current) {
        gsap.from(featuresRef.current.querySelectorAll(".feature-card"), {
          y: 40,
          opacity: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="acquire" className="relative py-24 md:py-32 px-4 md:pl-28 md:pr-12 border-t border-border/30">
      <div ref={headerRef} className="mb-12 md:mb-16">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">07 / PAID ACQUISITION</span>
        <h2 className="mt-4 md:mt-6 font-[var(--font-bebas)] text-4xl md:text-7xl tracking-tight">
          Paid acquisition, governed by the same system.
        </h2>
        <p className="mt-6 font-mono text-sm md:text-base text-muted-foreground max-w-3xl leading-relaxed">
          At Business tier, Hubbly extends the same shared intelligence and approval model into paid acquisition. Campaign creation, audience targeting, creative, compliance, tracking, and lead ingestion all run from the same buyer context as outbound.
        </p>
      </div>

      <div ref={featuresRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl">
        {features.map((feature, index) => (
          <div key={index} className="feature-card border border-border/50 bg-card/30 p-6 md:p-8">
            <h3 className="font-[var(--font-bebas)] text-xl md:text-2xl tracking-tight mb-3 md:mb-4 text-accent">
              {feature.title}
            </h3>
            <p className="font-mono text-xs md:text-sm text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
