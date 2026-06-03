"use client"

import { useRef, useEffect, useState, memo } from "react"
import { cn } from "@/lib/utils"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const agents = [
  // UNDERSTAND layer (top)
  { id: "recon", label: "RECON", sublabel: "Research", position: { x: 30, y: 8 }, layer: "understand" },
  { id: "icp", label: "ICP", sublabel: "Audience", position: { x: 50, y: 5 }, layer: "understand" },
  { id: "strategy", label: "STRATEGY", sublabel: "Plan", position: { x: 70, y: 8 }, layer: "understand" },
  // EXECUTE layer (middle ring)
  { id: "scout", label: "SCOUT", sublabel: "Find", position: { x: 90, y: 30 }, layer: "execute" },
  { id: "score", label: "SCORE", sublabel: "Rank", position: { x: 95, y: 50 }, layer: "execute" },
  { id: "writer", label: "WRITER", sublabel: "Draft", position: { x: 90, y: 70 }, layer: "execute" },
  { id: "sender", label: "SENDER", sublabel: "Launch", position: { x: 70, y: 88 }, layer: "execute" },
  { id: "voice", label: "VOICE", sublabel: "Call", position: { x: 50, y: 95 }, layer: "execute" },
  { id: "booker", label: "BOOKER", sublabel: "Book", position: { x: 30, y: 88 }, layer: "execute" },
  // IMPROVE layer (left side)
  { id: "track", label: "TRACK", sublabel: "Monitor", position: { x: 10, y: 70 }, layer: "improve" },
  { id: "optimize", label: "OPTIMIZE", sublabel: "Learn", position: { x: 5, y: 50 }, layer: "improve" },
  { id: "advisor", label: "ADVISOR", sublabel: "Advise", position: { x: 10, y: 30 }, layer: "improve" },
]

const AgentNetwork = memo(function AgentNetwork() {
  const [activeAgent, setActiveAgent] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isAnimating) {
          setIsAnimating(true)
        }
      },
      { threshold: 0.3 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [isAnimating])

  useEffect(() => {
    if (!isAnimating) return

    const interval = setInterval(() => {
      setActiveAgent((prev) => (prev + 1) % agents.length)
    }, 1200)

    return () => clearInterval(interval)
  }, [isAnimating])

  return (
    <div ref={containerRef} className="relative w-full h-[400px] md:h-[500px]">
      {/* Central memory core */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-40 md:h-40">
        {/* Outer pulse rings */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute inset-0 border border-accent/20 rounded-full"
            style={{
              animation: `pulse-glow ${2 + i * 0.5}s ease-in-out infinite`,
              transform: `scale(${1 + i * 0.3})`,
            }}
          />
        ))}
        
        {/* Core */}
        <div className="absolute inset-0 border-2 border-accent bg-accent/10 rounded-full flex items-center justify-center">
          <div className="text-center">
            <span className="font-[var(--font-bebas)] text-lg md:text-xl text-accent tracking-wider">SHARED</span>
            <span className="block font-mono text-xs text-foreground/60 uppercase tracking-widest">MEMORY</span>
          </div>
        </div>
        
        {/* Inner data visualization */}
        <div className="absolute inset-4 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-1 opacity-30">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-accent rounded-sm"
                style={{
                  animation: `pulse 1.5s ease-in-out infinite`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Agent nodes */}
      {agents.map((agent, index) => {
        const isActive = activeAgent === index
        
        return (
          <div
            key={agent.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${agent.position.x}%`,
              top: `${agent.position.y}%`,
            }}
          >
            {/* Connection line to center */}
            <svg
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                width: "300px",
                height: "300px",
              }}
            >
              <line
                x1="150"
                y1="150"
                x2={150 + (50 - agent.position.x) * 3}
                y2={150 + (50 - agent.position.y) * 3}
                className={cn(
                  "transition-all duration-300",
                  isActive ? "stroke-accent" : "stroke-border/30"
                )}
                strokeWidth={isActive ? 2 : 1}
                strokeDasharray={isActive ? "none" : "4 4"}
              />
            </svg>

            {/* Agent node */}
            <div
              className={cn(
                "relative z-10 w-14 h-14 md:w-16 md:h-16 border-2 flex flex-col items-center justify-center transition-all duration-500",
                isActive
                  ? (agent as any).layer === "understand" ? "border-green-500 bg-green-500/20 scale-110"
                  : (agent as any).layer === "improve" ? "border-purple-500 bg-purple-500/20 scale-110"
                  : "border-accent bg-accent/20 scale-110"
                  : "border-border/40 bg-background hover:border-accent/40"
              )}
            >
              {isActive && (
                <div className={cn(
                  "absolute inset-0 border-2 animate-ping opacity-30",
                  (agent as any).layer === "understand" ? "border-green-500"
                  : (agent as any).layer === "improve" ? "border-purple-500"
                  : "border-accent"
                )} />
              )}
              <span
                className={cn(
                  "font-[var(--font-bebas)] text-[9px] md:text-xs tracking-wider transition-colors duration-300",
                  isActive 
                    ? (agent as any).layer === "understand" ? "text-green-500"
                    : (agent as any).layer === "improve" ? "text-purple-500"
                    : "text-accent"
                    : "text-muted-foreground"
                )}
              >
                {agent.label}
              </span>
              <span className="font-mono text-[7px] text-muted-foreground/60 uppercase">
                {agent.sublabel}
              </span>
            </div>

            {/* Data packet animation */}
            {isActive && (
              <div
                className="absolute top-1/2 left-1/2 w-2 h-2 bg-accent rounded-full"
                style={{
                  animation: "dataFlow 0.6s ease-out forwards",
                }}
              />
            )}
          </div>
        )
      })}

      {/* Legend */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-wrap items-center justify-center gap-4 md:gap-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="font-mono text-[8px] md:text-[9px] text-muted-foreground uppercase tracking-widest">Understand</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-accent rounded-full" />
          <span className="font-mono text-[8px] md:text-[9px] text-muted-foreground uppercase tracking-widest">Execute</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full" />
          <span className="font-mono text-[8px] md:text-[9px] text-muted-foreground uppercase tracking-widest">Improve</span>
        </div>
      </div>
    </div>
  )
})

AgentNetwork.displayName = "AgentNetwork"

export function EngineSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const visualRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

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

      if (visualRef.current) {
        gsap.from(visualRef.current, {
          scale: 0.9,
          opacity: 0,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: visualRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        })
      }

      if (contentRef.current) {
        gsap.from(contentRef.current, {
          y: 40,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: contentRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="engine" className="relative py-24 md:py-32 px-4 md:pl-28 md:pr-12 border-t border-border/30">
      <div ref={headerRef} className="mb-12 md:mb-16">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">03 / FUNNEL</span>
        <h2 className="mt-4 md:mt-6 font-[var(--font-bebas)] text-4xl md:text-7xl tracking-tight">
          Twelve agents. One memory. Zero handoff loss.
        </h2>
        <p className="mt-4 font-mono text-sm text-muted-foreground max-w-3xl">
          Every agent has a defined role. Every action feeds the same operating memory. No disconnected tools. No lost context.
        </p>
      </div>

      {/* Agent Network Visual */}
      <div ref={visualRef}>
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-[1px] w-8 bg-accent/40" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Understand · Execute · Improve</span>
          <div className="h-[1px] w-8 bg-accent/40" />
        </div>
        <AgentNetwork />
        <div className="mt-6 text-center">
          <span className="font-mono text-xs text-muted-foreground">
            12 agents organized in 3 layers, sharing one operating memory.
          </span>
        </div>
      </div>

      <div ref={contentRef} className="max-w-3xl mt-12 md:mt-16">
        <p className="font-mono text-sm md:text-base text-foreground/80 leading-relaxed">
          Every agent in Hubbly works from the same shared context, so research, scoring, copy, voice, and booking stay aligned from first signal to scheduled meeting.
        </p>
        <a
          href="/architecture"
          className="inline-block mt-6 font-mono text-xs uppercase tracking-widest text-accent hover:text-accent/80 transition-colors"
        >
          Explore the 12-agent system and shared memory layer →
        </a>
      </div>
    </section>
  )
}
