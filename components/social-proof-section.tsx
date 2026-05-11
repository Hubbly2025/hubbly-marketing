"use client"

import { useRef, useEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export function SocialProofSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const quoteRef = useRef<HTMLDivElement>(null)

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

      if (quoteRef.current) {
        gsap.from(quoteRef.current, {
          y: 40,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: quoteRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="proof" className="relative py-24 md:py-32 px-4 md:pl-28 md:pr-12 border-t border-border/30">
      <div ref={headerRef} className="mb-12 md:mb-16">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">12 / PROOF</span>
        <h2 className="mt-4 md:mt-6 font-[var(--font-bebas)] text-4xl md:text-7xl tracking-tight">
          Built for teams that need more than another outbound tool.
        </h2>
      </div>

      <div ref={quoteRef} className="max-w-2xl">
        <p className="font-mono text-sm md:text-base text-foreground/80 leading-relaxed mb-8">
          Hubbly is designed for operators who want one system to research, execute, and learn across every revenue motion without losing context between tools or people.
        </p>
        <blockquote className="border-l-2 border-accent pl-6 md:pl-8">
          <p className="font-mono text-sm md:text-base text-foreground/90 leading-relaxed italic mb-6">
            &quot;Hubbly replaced our six-tool stack in the first week. We went from 4 hours a day operating tools to 10 minutes reviewing outcomes.&quot;
          </p>
          <footer className="font-mono text-xs text-muted-foreground">
            — Pilot customer · Name available on request
          </footer>
        </blockquote>
      </div>
    </section>
  )
}
