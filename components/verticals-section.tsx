"use client"

import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const configurations = [
  {
    name: "B2B",
    description: "For teams selling into accounts, operators, and longer, multi-threaded buying cycles.",
  },
  {
    name: "B2C",
    description: "For companies that win on timing, volume, and speed to lead.",
  },
  {
    name: "GLOBAL TEAMS",
    description: "Built for companies operating across regions, markets, and time zones.",
  },
  {
    name: "74 LANGUAGES",
    description: "Supports multilingual outreach, voice, and follow-up across your buyer markets.",
  },
  {
    name: "REGULATED CATEGORIES",
    description: "For industries where compliance and message precision are not optional.",
  },
  {
    name: "HIGH-CONSIDERATION PURCHASES",
    description: "For offers that require education, trust, and more than one touch to convert.",
  },
  {
    name: "INBOUND & OUTBOUND",
    description: "For teams running search, paid, email, voice, and follow-up from one system.",
  },
  {
    name: "CUSTOM CONFIGURATIONS",
    description: "For companies with workflows, buyers, or constraints that do not fit a template.",
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
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">08 / CONFIGURATION</span>
        <h2 className="mt-4 md:mt-6 font-[var(--font-bebas)] text-4xl md:text-7xl tracking-tight">
          Built for B2B, B2C, and global teams.
        </h2>
        <p className="mt-4 font-mono text-sm text-muted-foreground max-w-3xl leading-relaxed">
          Hubbly is one growth engine for companies selling to businesses, consumers, or both. It adapts to your market, buying cycle, channels, compliance requirements, and language — without changing the core system.
        </p>
      </div>

      <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {configurations.map((config, index) => (
          <div
            key={index}
            className="border border-border/50 bg-card/30 p-5 md:p-6 hover:border-accent/50 transition-colors duration-300"
          >
            <h3 className="font-[var(--font-bebas)] text-lg md:text-2xl tracking-tight text-accent mb-3 text-balance">
              {config.name}
            </h3>
            <p className="font-mono text-xs text-muted-foreground leading-relaxed">
              {config.description}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-10 md:mt-12 text-center font-mono text-sm text-muted-foreground">
        One growth engine, configured across markets and languages.
      </p>
    </section>
  )
}
