"use client"

import { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const verticals = [
  {
    title: "Sales and outbound",
    description: "Find buyers earlier, prioritize the right accounts, and automate outreach with stronger context.",
  },
  {
    title: "SEO and demand capture",
    description: "Identify search opportunities, competitor gaps, and content angles your market is already signaling.",
  },
  {
    title: "Voice and follow-up",
    description: "Run calling and reply handling from the same buyer context so conversations feel informed, not scripted.",
  },
  {
    title: "Growth operations",
    description: "Unify research, targeting, execution, and learning without stitching together another stack.",
  },
]

export function UseCasesSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
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

      if (gridRef.current) {
        const items = gridRef.current.querySelectorAll("article")
        gsap.from(items, {
          y: 60,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: gridRef.current,
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
    <section ref={sectionRef} id="use-cases" className="relative py-24 md:py-32 px-4 md:pl-28 md:pr-12 border-t border-border/30">
      <div ref={headerRef} className="mb-12 md:mb-16">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">09 / USE CASES</span>
        <h2 className="mt-4 md:mt-6 font-[var(--font-bebas)] text-4xl md:text-7xl tracking-tight">
          Built for markets where timing and relevance drive conversion.
        </h2>
      </div>

      <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {verticals.map((vertical, index) => (
          <VerticalCard key={index} vertical={vertical} index={index} />
        ))}
      </div>

      <div ref={closingRef} className="mt-12 md:mt-16 text-center">
        <p className="font-mono text-xs md:text-sm text-foreground/70">
          Do not see your market here? Define the buyer. Hubbly builds the system around it.
        </p>
      </div>
    </section>
  )
}

function VerticalCard({
  vertical,
  index,
}: {
  vertical: { title: string; description: string }
  index: number
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <article
      className={cn(
        "group relative border border-border/50 bg-card/30 p-5 md:p-8 transition-all duration-300 cursor-pointer",
        isHovered && "border-accent/60",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          "absolute inset-0 bg-accent/5 transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-0",
        )}
      />

      <div className="relative z-10">
        <h3
          className={cn(
            "font-[var(--font-bebas)] text-2xl md:text-3xl tracking-tight mb-4 transition-colors duration-300",
            isHovered ? "text-accent" : "text-foreground",
          )}
        >
          {vertical.title}
        </h3>
        <p className="font-mono text-sm text-muted-foreground leading-relaxed">
          {vertical.description}
        </p>
      </div>
    </article>
  )
}
