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
    title: "Built on signal, not static lists",
    description: "Hubbly identifies in-market buyers from verified records, intent signals, search behavior, and competitor context before anything touches your pipeline.",
  },
  {
    title: "Coordinated, not fragmented",
    description: "SEO, outbound, voice, replies, booking, and CRM sync operate from the same memory, so every function acts on the same intelligence.",
  },
  {
    title: "Strategic, not generic",
    description: "Hubbly does not just automate tasks. It builds a growth thesis from your market, then executes against it.",
  },
  {
    title: "Governed, not chaotic",
    description: "Safety rails are always on — snapshot, verify, rollback. Approval gates exist when you want them, off when you don't.",
  },
  {
    title: "Built for outcomes, not tool sprawl",
    description: "Instead of adding another point solution, Hubbly consolidates growth work into one operating layer.",
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
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">05 / WHY HUBBLY</span>
        <h2 className="mt-4 md:mt-6 font-[var(--font-bebas)] text-4xl md:text-7xl tracking-tight">
          Everything required to turn <HighlightText>market intelligence</HighlightText> into pipeline.
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
