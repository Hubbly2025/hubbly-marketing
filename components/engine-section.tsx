"use client"

import { useRef, useEffect, useState, memo } from "react"
import { cn } from "@/lib/utils"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const agents = [
  { id: "discover", label: "DISCOVER", sublabel: "Scout", position: { x: 50, y: 5 } },
  { id: "score", label: "SCORE", sublabel: "Analyst", position: { x: 80, y: 20 } },
  { id: "write", label: "WRITE", sublabel: "Writer", position: { x: 95, y: 50 } },
  { id: "send", label: "SEND", sublabel: "Engager", position: { x: 80, y: 80 } },
  { id: "call", label: "CALL", sublabel: "Voice", position: { x: 50, y: 95 } },
  { id: "listen", label: "LISTEN", sublabel: "Inbox", position: { x: 20, y: 80 } },
  { id: "book", label: "BOOK", sublabel: "Closer", position: { x: 5, y: 50 } },
  { id: "track", label: "TRACK", sublabel: "Revenue", position: { x: 20, y: 20 } },
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
                "relative z-10 w-16 h-16 md:w-20 md:h-20 border-2 flex flex-col items-center justify-center transition-all duration-500",
                isActive
                  ? "border-accent bg-accent/20 scale-110"
                  : "border-border/40 bg-background hover:border-accent/40"
              )}
            >
              {isActive && (
                <div className="absolute inset-0 border-2 border-accent animate-ping opacity-30" />
              )}
              <span
                className={cn(
                  "font-[var(--font-bebas)] text-xs md:text-sm tracking-wider transition-colors duration-300",
                  isActive ? "text-accent" : "text-muted-foreground"
                )}
              >
                {agent.label}
              </span>
              <span className="font-mono text-[8px] text-muted-foreground/60 uppercase">
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
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">Active sync</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-[1px] border-t border-dashed border-border/40" />
          <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">Memory link</span>
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
          Eight agents. One memory. Zero handoff loss.
        </h2>
      </div>

      {/* Agent Network Visual */}
      <div ref={visualRef}>
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-[1px] w-8 bg-accent/40" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">The Execution Layer</span>
          <div className="h-[1px] w-8 bg-accent/40" />
        </div>
        <AgentNetwork />
        <div className="mt-6 text-center">
          <a href="/#how-it-works" className="font-mono text-xs text-muted-foreground hover:text-accent transition-colors duration-200">
            Powered by 5 intelligence agents upstream. <span className="text-accent">↓ See how</span>
          </a>
        </div>
      </div>

      <div ref={contentRef} className="max-w-3xl mt-12 md:mt-16">
        <p className="font-mono text-sm md:text-base text-foreground/80 leading-relaxed">
          Every agent in Hubbly works from the same shared context, so research, scoring, copy, voice, and booking stay aligned from first signal to scheduled meeting.
        </p>
      </div>
    </section>
  )
}
