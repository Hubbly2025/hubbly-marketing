"use client"

import { useRef, useEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const oldStack = [
  { name: "Apollo", desc: "Data + sequencing" },
  { name: "Clay", desc: "Enrichment" },
  { name: "Instantly", desc: "Email warmup" },
  { name: "Smartlead", desc: "Email sending" },
  { name: "Aircall", desc: "Voice calls" },
  { name: "Calendly", desc: "Booking" },
  { name: "Zapier", desc: "Glue between tools" },
  { name: "HubSpot", desc: "CRM sync" },
]

export function StackReplacementSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const comparisonRef = useRef<HTMLDivElement>(null)
  const closingRef = useRef<HTMLDivElement>(null)

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

      if (comparisonRef.current) {
        gsap.from(comparisonRef.current.querySelectorAll(".stack-item"), {
          y: 30,
          opacity: 0,
          duration: 0.5,
          stagger: 0.05,
          ease: "power3.out",
          scrollTrigger: {
            trigger: comparisonRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        })
      }

      if (closingRef.current) {
        gsap.from(closingRef.current, {
          y: 40,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: closingRef.current,
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="replacement" className="relative py-24 md:py-32 px-4 md:pl-28 md:pr-12 border-t border-border/30">
      <div ref={headerRef} className="mb-12 md:mb-16">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">07 / STACK</span>
        <h2 className="mt-4 md:mt-6 font-[var(--font-bebas)] text-4xl md:text-7xl tracking-tight">
          Replace fragmented tools with one operating system.
        </h2>
        <p className="mt-4 font-mono text-sm text-muted-foreground leading-relaxed max-w-3xl">
          Most teams stitch together lead data, enrichment, sequencing, dialers, CRMs, AI copy tools, and reporting dashboards. Hubbly brings research, execution, memory, and optimization into one system with human oversight where it matters.
        </p>
      </div>

      <div ref={comparisonRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 max-w-5xl">
        {/* Left column - Old stack */}
        <div>
          <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground mb-6">
            Your Current Stack
          </h3>
          <div className="space-y-2">
            {oldStack.map((tool, index) => (
              <div key={tool.name} className="stack-item flex items-center">
                <div className="flex-1 border border-border/40 bg-card/20 p-3 md:p-4 flex items-center justify-between opacity-60">
                  <span className="font-mono text-xs md:text-sm text-muted-foreground">{tool.name}</span>
                  <span className="font-mono text-[10px] text-muted-foreground/60 hidden sm:block">{tool.desc}</span>
                </div>
                {index < oldStack.length - 1 && (
                  <span className="font-mono text-xs text-muted-foreground/40 mx-2 md:mx-3">+</span>
                )}
              </div>
            ))}
          </div>
          <p className="mt-6 font-mono text-xs text-red-400/80">
            ~$1,840/mo combined · 4 reps to operate · constant handoff failures
          </p>
        </div>

        {/* Right column - Hubbly */}
        <div className="flex flex-col">
          <h3 className="font-mono text-xs uppercase tracking-[0.3em] text-accent mb-6">
            Hubbly
          </h3>
          <div className="stack-item flex-1 border-2 border-accent bg-accent/5 p-8 md:p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
            <span className="font-[var(--font-bebas)] text-4xl md:text-5xl tracking-tight text-accent mb-2">
              Hubbly OS
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              One system. 13 agents. Shared memory.
            </span>
          </div>
          <p className="mt-6 font-mono text-xs text-accent">
            From $98/mo · 0 operators needed · built for scale
          </p>
        </div>
      </div>

      <div ref={closingRef} className="mt-12 md:mt-20 text-center max-w-3xl mx-auto">
        <p className="font-mono text-sm text-foreground">
          Pro saves $1,542/month vs. the average 8-tool stack, saves 30 hours of ops time per week, and gets you live in 15 minutes instead of 6 weeks.
        </p>
      </div>
    </section>
  )
}
