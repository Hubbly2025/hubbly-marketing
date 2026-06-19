"use client"

import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const agents = [
  {
    name: "RILEY",
    vertical: "Life Insurance",
    description: "Knows term, whole, IUL, and final expense compliance.",
  },
  {
    name: "MORGAN",
    vertical: "Mortgage",
    description: "Fluent in conventional, FHA, VA, jumbo, and refi cycles.",
  },
  {
    name: "FINCHAL",
    vertical: "Financial Services",
    description: "Built for wealth management and advisory conversations.",
  },
  {
    name: "GRACE",
    vertical: "Final Expense",
    description: "Empathetic, compliant, and senior-friendly.",
  },
  {
    name: "MEDI",
    vertical: "Medicare",
    description: "AEP-aware, dual-eligible-aware, plan-fluent.",
  },
  {
    name: "TALENT SCOUT",
    vertical: "Recruiting",
    description: "Sources, qualifies, and books candidate calls.",
  },
  {
    name: "SAAS SCOUT",
    vertical: "B2B SaaS",
    description: "Knows ICPs, MEDDIC, and modern sales cadences.",
  },
  {
    name: "REALTY",
    vertical: "Real Estate",
    description: "Buyer and seller workflows for residential and commercial.",
  },
]

export function VerticalsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!sectionRef.current) return

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 80%",
        end: "top 20%",
        toggleActions: "play none none reverse",
      },
    })

    if (headerRef.current) {
      tl.fromTo(
        headerRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
      )
    }

    if (gridRef.current) {
      tl.fromTo(
        gridRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" },
        "-=0.4"
      )
    }
  }, [])

  return (
    <section ref={sectionRef} id="verticals" className="relative py-24 md:py-32 px-4 md:pl-28 md:pr-12 border-t border-border/30">
      <div ref={headerRef} className="mb-12 md:mb-16">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">10 / INDUSTRIES</span>
        <h2 className="mt-4 md:mt-6 font-[var(--font-bebas)] text-4xl md:text-7xl tracking-tight">
          Pre-built for your vertical.
        </h2>
        <p className="mt-4 font-mono text-sm text-muted-foreground max-w-3xl leading-relaxed">
          Eight vertical specialists ship with Hubbly. Each is a pre-configured persona that runs on top of the 12-agent system. Pick yours at signup.
        </p>
      </div>

      <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {agents.map((agent, index) => (
          <div
            key={index}
            className="border border-border/50 bg-card/30 p-5 md:p-6 hover:border-accent/50 transition-colors duration-300"
          >
            <h3 className="font-[var(--font-bebas)] text-xl md:text-2xl tracking-tight text-foreground mb-1">
              {agent.name}
            </h3>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-3">
              {agent.vertical}
            </p>
            <p className="font-mono text-xs text-muted-foreground leading-relaxed">
              {agent.description}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-10 md:mt-12 text-center font-mono text-sm text-muted-foreground">
        Don&apos;t see your vertical? Hubbly supports custom verticals on Pro tier and above.
      </p>
    </section>
  )
}
