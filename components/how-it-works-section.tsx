"use client"

import { useRef, useEffect, useState, memo, useMemo } from "react"
import { cn } from "@/lib/utils"
import LazyDemo from "@/components/lazy-demo"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const steps = [
  {
    number: "01",
    title: "Analyze the business",
    description: "Hubbly ingests your website, offer, market, and positioning to understand what you sell, where you fit, and what should drive demand.",
  },
  {
    number: "02",
    title: "Map the market",
    description: "It identifies your best-fit buyers, scouts competitors, benchmarks strengths and weaknesses, and reads the search landscape to find where you can win.",
  },
  {
    number: "03",
    title: "Build the strategy",
    description: "Hubbly turns that intelligence into ICP logic, campaign direction, SEO opportunities, creative recommendations, and workflow priorities.",
  },
  {
    number: "04",
    title: "Launch execution",
    description: "Specialized agents coordinate outreach, voice, replies, booking, and optimization from the approved strategy.",
  },
  {
    number: "05",
    title: "Learn and improve",
    description: "Meetings, replies, objections, and conversion data feed back into the system so every cycle becomes sharper than the last.",
  },
]

const intelligenceStages = [
  { label: "RECON", sub: "Research" },
  { label: "COMPETITOR", sub: "Intel" },
  { label: "ICP", sub: "Audience" },
  { label: "GTM STRATEGY", sub: "Plan" },
  { label: "CREATIVE", sub: "Assets" },
]

const executionStages: { label: string; sub: string; tint?: string }[] = [
  { label: "DISCOVER", sub: "Find buyers" },
  { label: "SCORE", sub: "Rank intent", tint: "var(--rank)" },
  { label: "WRITE", sub: "Draft outreach" },
  { label: "SEND", sub: "Launch email", tint: "var(--send)" },
  { label: "CALL", sub: "AI voice", tint: "var(--voice)" },
  { label: "BOOK", sub: "Close calendar" },
  { label: "TRACK", sub: "Log revenue" },
  { label: "OPTIMIZE", sub: "Learning loop" },
]

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [activeIntelStage, setActiveIntelStage] = useState(0)
  const [activeExecStage, setActiveExecStage] = useState(0)

  useEffect(() => {
    const intelInterval = setInterval(() => {
      setActiveIntelStage((prev) => (prev + 1) % intelligenceStages.length)
    }, 1500)
    const execInterval = setInterval(() => {
      setActiveExecStage((prev) => (prev + 1) % executionStages.length)
    }, 1200)
    return () => {
      clearInterval(intelInterval)
      clearInterval(execInterval)
    }
  }, [])

  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      gsap.from(".how-header", {
        x: -60,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".how-header",
          start: "top 85%",
        },
      })

      gsap.from(".how-step", {
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".how-steps",
          start: "top 85%",
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="how-it-works" className="section-shell relative py-28 md:py-44 px-4 md:pl-28 md:pr-12 border-t border-border/30">
      {/* Header */}
      <div className="how-header mb-14 md:mb-20">
        <span className="font-mono text-xs md:text-sm uppercase tracking-[0.3em] text-accent">04 / HOW IT WORKS</span>
        <h2 className="mt-5 md:mt-7 font-[var(--font-bebas)] text-5xl md:text-8xl lg:text-9xl leading-[0.95] tracking-tight text-balance">From market intelligence to coordinated execution.</h2>
      </div>

      {/* Two-Row Flow Diagram */}
      <div className="mb-12 md:mb-16 border border-border/40 p-4 md:p-8">
        
        {/* Row 1 - Intelligence Layer */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4 md:mb-6">
            <div className="h-[1px] w-6 md:w-8 bg-green-500/40" />
            <span className="font-mono text-[8px] md:text-[9px] uppercase tracking-[0.2em] md:tracking-[0.3em] text-green-500">Intelligence Layer</span>
            <div className="h-[1px] w-6 md:w-8 bg-green-500/40" />
          </div>
          
          <div className="grid grid-cols-5 gap-1.5 md:gap-3">
            {intelligenceStages.map((stage, index) => (
              <div key={stage.label} className="relative">
                <div
                  className={cn(
                    "relative border p-2 md:p-4 text-center transition-all duration-300",
                    activeIntelStage === index
                      ? "border-green-500 bg-green-500/10 scale-105"
                      : activeIntelStage > index
                      ? "border-green-500/30 bg-green-500/5"
                      : "border-border/40"
                  )}
                >
                  {activeIntelStage === index && (
                    <div className="absolute inset-0 border border-green-500 animate-pulse" />
                  )}
                  <span className={cn(
                    "font-[var(--font-bebas)] text-[10px] md:text-base tracking-wider block",
                    activeIntelStage >= index ? "text-green-500" : "text-muted-foreground"
                  )}>
                    {stage.label}
                  </span>
                  <span className="font-mono text-[7px] md:text-[10px] text-muted-foreground uppercase">
                    {stage.sub}
                  </span>
                </div>
                {/* Arrow connector (except last) */}
                {index < intelligenceStages.length - 1 && (
                  <div className="absolute top-1/2 -right-2 md:-right-3 transform -translate-y-1/2 text-green-500/40 text-xs hidden md:block">→</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Connection Arrow */}
        <div className="flex flex-col items-center gap-2 my-6">
          <div className="text-accent text-xl">↓</div>
          <span className="font-mono text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-wider">Approved strategy fires execution</span>
        </div>

        {/* Row 2 - Execution Layer */}
        <div>
          <div className="flex items-center justify-center gap-2 mb-4 md:mb-6">
            <div className="h-[1px] w-6 md:w-8 bg-accent/40" />
            <span className="font-mono text-[8px] md:text-[9px] uppercase tracking-[0.2em] md:tracking-[0.3em] text-accent">Execution Layer</span>
            <div className="h-[1px] w-6 md:w-8 bg-accent/40" />
          </div>
          
          <div className="grid grid-cols-4 md:grid-cols-8 gap-1.5 md:gap-3">
            {executionStages.map((stage, index) => {
              const on = activeExecStage >= index
              const isActive = activeExecStage === index
              const c = stage.tint ?? "var(--accent)"
              return (
                <div
                  key={stage.label}
                  className={cn(
                    "relative border p-2 md:p-4 text-center transition-all duration-300",
                    isActive && "scale-105",
                    !on && "border-border/40"
                  )}
                  style={
                    on
                      ? {
                          borderColor: isActive ? c : `color-mix(in srgb, ${c} 60%, transparent)`,
                          backgroundColor: `color-mix(in srgb, ${c} ${isActive ? "26%" : "16%"}, transparent)`,
                          boxShadow: isActive ? `0 0 20px color-mix(in srgb, ${c} 45%, transparent)` : undefined,
                        }
                      : undefined
                  }
                >
                  {isActive && (
                    <div className="absolute inset-0 border animate-pulse" style={{ borderColor: c }} />
                  )}
                  <span
                    className="font-[var(--font-bebas)] text-[10px] md:text-base tracking-wider block"
                    style={{ color: on ? c : "var(--muted-foreground)" }}
                  >
                    {stage.label}
                  </span>
                  <span className="font-mono text-[7px] md:text-[10px] text-muted-foreground uppercase">
                    {stage.sub}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Updated Legend */}
        <div className="mt-6 md:mt-8 flex flex-wrap justify-center gap-3 md:gap-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="font-mono text-[9px] md:text-xs text-foreground/70 uppercase tracking-wider">Intelligence</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" style={{ animationDelay: "0.3s" }}></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
            </span>
            <span className="font-mono text-[9px] md:text-xs text-foreground/70 uppercase tracking-wider">Signals</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" style={{ animationDelay: "0.6s" }}></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <span className="font-mono text-[9px] md:text-xs text-foreground/70 uppercase tracking-wider">Outreach</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" style={{ animationDelay: "0.9s" }}></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="font-mono text-[9px] md:text-xs text-foreground/70 uppercase tracking-wider">Learning</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75" style={{ animationDelay: "1.2s" }}></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            <span className="font-mono text-[9px] md:text-xs text-foreground/70 uppercase tracking-wider">Revenue</span>
          </div>
        </div>
      </div>

      {/* Steps Grid */}
      <div className="how-steps grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {steps.map((step, index) => (
          <article
            key={index}
            className="how-step group border border-border/50 bg-card/30 p-5 md:p-8 hover:border-accent/60 transition-all duration-300"
          >
            <span className="font-mono text-[10px] md:text-xs uppercase tracking-[0.3em] text-accent mb-3 md:mb-4 block">
              {step.number}
            </span>
            <h3 className="font-[var(--font-bebas)] text-2xl md:text-3xl tracking-tight mb-3 md:mb-4 text-foreground group-hover:text-accent transition-colors duration-300">
              {step.title}
            </h3>
            <p className="font-mono text-xs md:text-sm text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </article>
        ))}
      </div>

      {/* Demo: see each part run */}
      <div className="mt-12 md:mt-16">
        <h3 className="font-[var(--font-bebas)] text-2xl md:text-3xl tracking-tight mb-6 md:mb-8 text-accent">
          See each part run
        </h3>
        <div className="mx-auto max-w-[1400px] px-2 md:px-4">
          <LazyDemo
            src="/demos/hubbly-agent-demos.html"
            title="Hubbly system demos"
            aspect={null}
            className="h-[min(80vh,860px)]"
          />
        </div>
      </div>

      {/* Closing statement */}
      <div className="mt-10 border-l-2 border-accent pl-6 max-w-2xl">
        <p className="font-mono text-sm text-foreground uppercase tracking-widest">
          Full autopilot by default. Rails always on: snapshot before every change, verify after every publish,
          auto-rollback on regression. Approval gates are an opt-in toggle.
        </p>
      </div>
    </section>
  )
}
