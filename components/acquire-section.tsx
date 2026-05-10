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
    description: "The Creative agent generates your ad copy, static images via FLUX 1.1 Pro, and 30-second video ads via HeyGen — all branded to your vertical. Acquire takes the approved assets and runs them.",
  },
  {
    title: "Compliant by default",
    description: "TCPA-compliant consent language. DNC list scrubbing. TrustedForm certificates. CAPI deduplication. Compliance is a property of the system, not a checklist you maintain.",
  },
  {
    title: "One pipeline",
    description: "Every Meta lead flows into the same shared memory as your outbound. Score ranks it. Write personalizes follow-up. Call dials it. Book schedules it. No fragmentation between paid and outbound.",
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
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">07 / BUSINESS TIER</span>
        <h2 className="mt-4 md:mt-6 font-[var(--font-bebas)] text-4xl md:text-7xl tracking-tight">
          Meta ads. Done for you.
        </h2>
        <p className="mt-6 font-mono text-sm md:text-base text-muted-foreground max-w-3xl leading-relaxed">
          At Business tier, the Acquire agent runs your Meta Lead Ads end-to-end. Campaign creation, audience targeting, creative upload, CAPI tracking, TCPA + DNC + TrustedForm compliance, and lead ingestion — straight into the same shared memory as your outbound. Same buyer. One conversation.
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
