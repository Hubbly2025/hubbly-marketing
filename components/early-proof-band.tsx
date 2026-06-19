"use client"

import { useRef, useEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export function EarlyProofBand() {
  const sectionRef = useRef<HTMLElement>(null)
  const itemsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current || !itemsRef.current) return

    const ctx = gsap.context(() => {
      const items = itemsRef.current!.querySelectorAll(":scope > div")
      gsap.from(items, {
        y: 30,
        opacity: 0,
        duration: 0.7,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: itemsRef.current,
          start: "top 88%",
          toggleActions: "play none none reverse",
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      aria-label="Customer proof"
      className="relative px-4 md:pl-28 md:pr-12 py-12 md:py-14 border-t border-border/30"
    >
      <div
        ref={itemsRef}
        className="grid grid-cols-1 md:grid-cols-3 border border-border/40 divide-y md:divide-y-0 md:divide-x divide-border/40"
      >
        {/* Testimonial */}
        <div className="p-6 md:p-8 flex flex-col justify-between gap-6">
          <p className="font-mono text-sm text-foreground/90 leading-relaxed text-pretty">
            &quot;Hubbly replaced our six-tool stack in week one. We went from 4 hours/day operating tools to 10 minutes reviewing outcomes.&quot;
          </p>
          <footer className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            — Founder, Texas mortgage brokerage · 14 reps
          </footer>
        </div>

        {/* Concrete outcome */}
        <div className="p-6 md:p-8 flex flex-col justify-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Outcome</span>
          <div className="font-[var(--font-bebas)] text-4xl md:text-5xl tracking-tight text-foreground">
            23 meetings
          </div>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed">
            Qualified and booked in the first 30 days.
          </p>
        </div>

        {/* Trust marker */}
        <div className="p-6 md:p-8 flex flex-col justify-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Foundation</span>
          <div className="font-[var(--font-bebas)] text-4xl md:text-5xl tracking-tight text-foreground">
            498M+ records
          </div>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed">
            Intent-qualified buyer data behind every campaign.
          </p>
        </div>
      </div>
    </section>
  )
}
