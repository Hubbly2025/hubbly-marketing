"use client"

import { useEffect, useRef } from "react"
import { ScrambleTextOnHover } from "@/components/scramble-text"
import { SplitFlapText, SplitFlapAudioProvider } from "@/components/split-flap-text"
import { AnimatedNoise } from "@/components/animated-noise"
import { BitmapChevron } from "@/components/bitmap-chevron"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sectionRef.current || !contentRef.current) return

    const ctx = gsap.context(() => {
      gsap.to(contentRef.current, {
        y: -100,
        opacity: 0,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="hero" className="relative min-h-[85vh] md:min-h-screen flex items-center px-4 md:pl-28 md:pr-12 pt-16 md:pt-0">
      <AnimatedNoise opacity={0.03} />

      {/* Left vertical labels - hidden on mobile */}
      <div className="hidden md:block absolute left-6 top-1/2 -translate-y-1/2">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-foreground/50 -rotate-90 origin-left block whitespace-nowrap">
          01 / HUBBLY
        </span>
      </div>

      {/* Main content */}
      <div ref={contentRef} className="flex-1 w-full">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-border/40 rounded-full mb-4">
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="font-mono text-[10px] md:text-[13px] tracking-[0.1em] text-muted-foreground uppercase">
            Autonomous Growth Engine
          </span>
        </div>

        <div role="img" aria-label="Hubbly — Autonomous Growth Engine wordmark">
          <SplitFlapAudioProvider>
            <SplitFlapText text="HUBBLY" speed={80} />
          </SplitFlapAudioProvider>
        </div>

        <h1 className="font-[var(--font-bebas)] text-foreground text-[clamp(1.5rem,4vw,3.5rem)] mt-4 md:mt-6 tracking-wide max-w-4xl leading-tight text-balance">
          Drop your website in. <span className="text-accent">Hubbly goes to work.</span>
        </h1>

        <p className="mt-4 md:mt-6 max-w-2xl font-mono text-sm md:text-base text-foreground/60 leading-relaxed italic">
          Hubbly analyzes your market, scouts competitors, and activates growth through specialized agents running on autopilot — with your team in control.
        </p>

        <p className="mt-3 max-w-2xl font-mono text-[10px] md:text-xs uppercase tracking-[0.15em] text-foreground/45 leading-relaxed">
          The strategy of a top firm. The autonomy of a built system. The simplicity of one input.
        </p>

        <p className="mt-4 md:mt-6 max-w-2xl font-mono text-sm md:text-base text-foreground/80 leading-relaxed">
          Give Hubbly your website. It learns your market, identifies where you can win, and turns that intelligence into coordinated execution.
        </p>

        <p className="mt-4 font-mono text-xs md:text-sm text-accent tracking-wide">
          12 specialized agents. 3 operating layers. 1 autonomous growth engine.
        </p>

        <div className="mt-8 md:mt-10 grid grid-cols-1 sm:grid-cols-3 gap-px border border-border/40 bg-border/40 max-w-4xl">
          {[
            {
              number: "01",
              title: "Plug in your website.",
              description: "Hubbly reads your market, competitors, and demand in minutes.",
            },
            {
              number: "02",
              title: "Autopilot for growth.",
              description: "It plans who to target, what to say, and when to launch.",
            },
            {
              number: "03",
              title: "Control when you want it.",
              description: "You approve the plan. Hubbly runs outreach, voice, and booking.",
            },
          ].map((point) => (
            <div key={point.number} className="flex flex-col bg-background p-4 md:p-5">
              <span className="font-mono text-[10px] tracking-[0.3em] text-accent">{point.number}</span>
              <h2 className="mt-3 font-[var(--font-bebas)] text-lg md:text-xl tracking-wide text-foreground text-balance">
                {point.title}
              </h2>
              <p className="mt-2 font-mono text-[11px] md:text-xs text-foreground/55 leading-relaxed text-pretty">
                {point.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 md:mt-12 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6">
          <a
            href="#audit"
            className="group inline-flex items-center justify-center gap-3 bg-accent px-5 py-3 md:px-6 md:py-4 font-mono text-xs md:text-sm uppercase tracking-widest text-background hover:bg-accent/90 transition-all duration-200 min-h-[48px]"
          >
            <ScrambleTextOnHover text="Run Free Audit" as="span" duration={0.6} />
            <BitmapChevron className="transition-transform duration-[400ms] ease-in-out group-hover:rotate-45" />
          </a>
          <a
            href="#how-it-works"
            className="font-mono text-xs md:text-sm uppercase tracking-widest text-foreground/70 hover:text-foreground transition-colors duration-200 border border-border/50 px-5 py-3 md:px-6 md:py-4 text-center min-h-[48px] flex items-center justify-center"
          >
            See How It Works →
          </a>
        </div>
      </div>

      {/* Floating info tag - hidden on mobile */}
      <div className="hidden sm:block absolute bottom-8 right-8 md:bottom-12 md:right-12">
        <div className="border border-border/50 bg-card/30 px-4 py-2 font-mono text-xs uppercase tracking-widest text-foreground/60">
          AUTONOMOUS GROWTH ENGINE
        </div>
      </div>
    </section>
  )
}
