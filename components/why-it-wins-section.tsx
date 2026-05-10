"use client"

import { useRef, useEffect } from "react"
import { HighlightText } from "@/components/highlight-text"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const cards = [
  {
    title: "Verified, not guessed",
    description: "Every lead is verified against 498M records and 43K intent topics before it touches your pipeline. No list spray. No guessing. No waste.",
  },
  {
    title: "Coordinated, not fragmented",
    description: "Email, voice, inbox, and booking all run from the same memory. When a buyer replies, every agent already knows the full history.",
  },
  {
    title: "Systematic, not manual",
    description: "Your reps stop juggling Apollo, Clay, Instantly, Smartlead, Aircall, and Calendly. Hubbly replaces all of it with one interface.",
  },
  {
    title: "Priced for outcome, not seats",
    description: "Pay for leads and voice minutes, not per-seat licenses. Your team can grow without your bill exploding.",
  },
  {
    title: "Approved, not autonomous",
    description: "Five approval gates between intelligence and execution. You review the company profile, the ICP, the strategy, the creative — then Hubbly runs. No agents talking to agents in the background. No surprises. You stay in control of every campaign that goes live.",
  },
]

export function WhyItWinsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

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

      if (cardsRef.current) {
        const items = cardsRef.current.querySelectorAll("article")
        items.forEach((item, index) => {
          const isRight = index % 2 === 1
          gsap.from(item, {
            x: isRight ? 80 : -80,
            opacity: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: item,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          })
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="why-it-wins" className="relative py-24 md:py-32 px-4 md:pl-28 md:pr-12 border-t border-border/30">
      <div ref={headerRef} className="mb-12 md:mb-16">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">06 / REPLACEMENT</span>
        <h2 className="mt-4 md:mt-6 font-[var(--font-bebas)] text-4xl md:text-7xl tracking-tight">
          Built for <HighlightText>signal</HighlightText>. Not list spray.
        </h2>
      </div>

      <div ref={cardsRef} className="space-y-12 md:space-y-20">
        {cards.map((card, index) => (
          <article
            key={index}
            className={`flex flex-col ${
              index % 2 === 1 ? "md:items-end md:text-right" : "items-start text-left"
            }`}
          >
            <h3 className="font-[var(--font-bebas)] text-2xl md:text-5xl tracking-tight leading-none mb-3 md:mb-4">
              {card.title.split(", ").map((part, i) => (
                <span key={i}>
                  {i === 0 ? <HighlightText>{part}</HighlightText> : <span>, {part}</span>}
                </span>
              ))}
            </h3>
            <p className="max-w-md font-mono text-xs md:text-sm text-muted-foreground leading-relaxed">
              {card.description}
            </p>
            <div className={`mt-4 md:mt-6 h-[1px] bg-border w-20 md:w-48 ${index % 2 === 1 ? "md:mr-0" : "ml-0"}`} />
          </article>
        ))}
      </div>
    </section>
  )
}
