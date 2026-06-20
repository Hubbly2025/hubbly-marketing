"use client"

import { useState, useRef, useEffect, memo } from "react"
import { cn } from "@/lib/utils"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const modules = [
  {
    title: "Signal Engine",
    tag: "DISCOVERY",
    description: "Identifies in-market buyers from 498M+ records. Geo-targeted. Intent-scored. Verified.",
    span: "col-span-2 row-span-2",
    stats: { active: "2.4K", label: "signals/hr" },
    visual: "radar",
  },
  {
    title: "Writer Agent",
    tag: "OUTREACH",
    description: "Claude Sonnet drafts personalized emails. Quality scored before sending.",
    span: "col-span-1 row-span-1",
    stats: { active: "847", label: "drafts today" },
    visual: "typing",
  },
  {
    title: "Voice Agent",
    tag: "CALLING",
    description: "Calls high-priority leads automatically. Every outcome logged and routed.",
    span: "col-span-1 row-span-2",
    stats: { active: "12", label: "live calls" },
    visual: "waveform",
  },
  {
    title: "Reply Inbox",
    tag: "CLASSIFICATION",
    description: "AI-scored inbound. Hot/warm/cold. One-click CRM sync.",
    span: "col-span-1 row-span-1",
    stats: { active: "156", label: "pending" },
    visual: "inbox",
  },
  {
    title: "Booking Layer",
    tag: "CONVERSION",
    description: "Positive engagement becomes scheduled meetings. Calendar integration.",
    span: "col-span-2 row-span-1",
    stats: { active: "23", label: "this week" },
    visual: "calendar",
  },
  {
    title: "CRM Sync",
    tag: "INTEGRATION",
    description: "Activity, leads, outcomes — all pushed to your existing system.",
    span: "col-span-1 row-span-1",
    stats: { active: "99.9%", label: "uptime" },
    visual: "sync",
  },
]

export function ModulesSection() {
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
    <section ref={sectionRef} id="modules" className="relative py-24 md:py-32 px-4 md:pl-28 md:pr-12 border-t border-border/30">
      {/* Pull quote */}
      <div className="mb-12 md:mb-16 border-l-2 border-accent pl-4 md:pl-6 max-w-3xl">
        <p className="font-mono text-xs md:text-sm text-foreground uppercase tracking-widest">
          Every function acts on the same intelligence. Nothing breaks across tools.
        </p>
      </div>

      <div ref={headerRef} className="mb-12 md:mb-16 flex items-end justify-between">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">05 / CAPABILITIES</span>
          <h2 className="mt-4 md:mt-6 font-[var(--font-bebas)] text-4xl md:text-7xl tracking-tight max-w-4xl">
            Everything Hubbly runs from one system.
          </h2>
        </div>
        <p className="hidden md:block max-w-xs font-mono text-sm text-muted-foreground text-right leading-relaxed">
          Twelve coordinated agents. One shared memory. Zero manual handoffs.
        </p>
      </div>

      {/* Bento Grid */}
      <div
        ref={gridRef}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 auto-rows-[140px] sm:auto-rows-[160px] md:auto-rows-[200px]"
      >
        {modules.map((module, index) => (
          <ModuleCard key={index} module={module} index={index} />
        ))}
      </div>

      <div ref={closingRef} className="mt-12 md:mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="font-mono text-xs md:text-sm text-foreground/80">All systems operational</span>
        </div>
        <div className="hidden sm:block h-4 w-px bg-border/40" />
        <p className="font-mono text-xs md:text-sm text-muted-foreground text-center">
          Every module works independently. The system works together.
        </p>
      </div>
    </section>
  )
}

function ModuleCard({
  module,
  index,
}: {
  module: { 
    title: string
    tag: string
    description: string
    span: string
    stats: { active: string; label: string }
    visual: string
  }
  index: number
}) {
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLElement>(null)
  const [isScrollActive, setIsScrollActive] = useState(false)

  useEffect(() => {
    if (index !== 0 || !cardRef.current) return

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: cardRef.current,
        start: "top 80%",
        onEnter: () => setIsScrollActive(true),
      })
    }, cardRef)

    return () => ctx.revert()
  }, [index])

  const isActive = isHovered || isScrollActive

  return (
    <article
      ref={cardRef}
      className={cn(
        "group relative border border-border/40 p-5 flex flex-col justify-between transition-all duration-500 cursor-pointer overflow-hidden",
        module.span,
        isActive && "border-accent/60",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background layer */}
      <div
        className={cn(
          "absolute inset-0 bg-accent/5 transition-opacity duration-500",
          isActive ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Visual element based on type */}
      <ModuleVisual type={module.visual} isActive={isActive} />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs uppercase tracking-widest text-foreground/60">
            {module.tag}
          </span>
          {/* Live indicator */}
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent"></span>
            </span>
            <span className="font-mono text-xs text-accent">{module.stats.active}</span>
          </span>
        </div>
        <h3
          className={cn(
            "font-[var(--font-bebas)] text-2xl md:text-4xl tracking-tight transition-colors duration-300",
            isActive ? "text-accent" : "text-foreground",
          )}
        >
          {module.title}
        </h3>
      </div>

      {/* Description - reveals on hover */}
      <div className="relative z-10 mt-auto">
        <p
          className={cn(
            "font-mono text-sm text-foreground/80 leading-relaxed transition-all duration-500 max-w-[280px]",
            isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
          )}
        >
          {module.description}
        </p>
        <span className="font-mono text-xs text-muted-foreground mt-2 block">
          {module.stats.label}
        </span>
      </div>

      {/* Index marker */}
      <span
        className={cn(
          "absolute bottom-4 right-4 font-mono text-xs transition-colors duration-300",
          isActive ? "text-accent" : "text-muted-foreground/60",
        )}
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* Corner accent */}
      <div
        className={cn(
          "absolute top-0 right-0 w-12 h-12 transition-all duration-500",
          isActive ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="absolute top-0 right-0 w-full h-[1px] bg-accent" />
        <div className="absolute top-0 right-0 w-[1px] h-full bg-accent" />
      </div>
    </article>
  )
}

const ModuleVisual = memo(function ModuleVisual({ type, isActive }: { type: string; isActive: boolean }) {
  if (type === "radar") {
    return (
      <div className={cn(
        "absolute inset-0 flex items-center justify-center transition-opacity duration-500",
        isActive ? "opacity-20" : "opacity-10"
      )}>
        <div className="relative w-48 h-48">
          {/* Radar circles */}
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="absolute inset-0 border border-accent/30 rounded-full"
              style={{
                transform: `scale(${i * 0.25})`,
                animation: `pulse-glow ${2 + i * 0.5}s ease-in-out infinite`,
              }}
            />
          ))}
          {/* Radar sweep */}
          <div 
            className="absolute inset-0 origin-center"
            style={{
              background: `conic-gradient(from 0deg, transparent 0deg, oklch(0.7 0.2 45 / 0.3) 30deg, transparent 60deg)`,
              animation: "spin 4s linear infinite",
            }}
          />
          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-accent rounded-full" />
          {/* Signal dots */}
          {[
            { x: 30, y: 20 },
            { x: -25, y: 35 },
            { x: 40, y: -15 },
            { x: -35, y: -30 },
            { x: 15, y: 45 },
          ].map((pos, i) => (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-accent rounded-full animate-pulse"
              style={{
                transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (type === "typing") {
    return (
      <div className={cn(
        "absolute bottom-16 right-4 font-mono text-[10px] text-accent/40 transition-opacity duration-500",
        isActive ? "opacity-60" : "opacity-30"
      )}>
        <div className="flex items-center gap-1">
          <span>Drafting</span>
          <span className="inline-flex">
            <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
          </span>
        </div>
      </div>
    )
  }

  if (type === "waveform") {
    return (
      <div className={cn(
        "absolute inset-x-4 top-1/2 -translate-y-1/2 flex items-center justify-center gap-0.5 transition-opacity duration-500",
        isActive ? "opacity-40" : "opacity-20"
      )}>
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="w-1 bg-accent rounded-full"
            style={{
              height: `${Math.random() * 40 + 10}px`,
              animation: `waveform 1s ease-in-out infinite`,
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>
    )
  }

  if (type === "inbox") {
    return (
      <div className={cn(
        "absolute bottom-16 right-4 flex flex-col gap-1 transition-opacity duration-500",
        isActive ? "opacity-60" : "opacity-30"
      )}>
        {["HOT", "WARM", "COLD"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              i === 0 && "bg-red-500",
              i === 1 && "bg-yellow-500",
              i === 2 && "bg-blue-500",
            )} />
            <span className="font-mono text-[9px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    )
  }

  if (type === "calendar") {
    return (
      <div className={cn(
        "absolute right-4 top-1/2 -translate-y-1/2 grid grid-cols-7 gap-1 transition-opacity duration-500",
        isActive ? "opacity-40" : "opacity-20"
      )}>
        {Array.from({ length: 21 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-3 h-3 rounded-sm border border-border/40",
              [3, 7, 12, 15, 19].includes(i) && "bg-accent/60 border-accent/60",
            )}
          />
        ))}
      </div>
    )
  }

  if (type === "sync") {
    return (
      <div className={cn(
        "absolute bottom-16 right-4 transition-opacity duration-500",
        isActive ? "opacity-60" : "opacity-30"
      )}>
        <div 
          className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full"
          style={{ animation: "spin 1s linear infinite" }}
        />
      </div>
    )
  }

  return null
})

ModuleVisual.displayName = "ModuleVisual"
