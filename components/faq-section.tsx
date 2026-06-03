"use client"

import { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const faqs = [
  {
    question: "What is Hubbly?",
    answer: "Hubbly is an autonomous revenue operating system that turns a website, offer, and market position into a live pipeline engine. It combines research, ICP building, enrichment, outreach, voice, booking, and optimization in one shared system.",
  },
  {
    question: "How does Hubbly work?",
    answer: "Hubbly analyzes the business, maps the best-fit buyer profile, builds targeting logic, writes and launches outreach, places voice calls, books meetings, and learns from replies and conversions over time.",
  },
  {
    question: "Who is Hubbly for?",
    answer: "Hubbly is built for growth teams, agencies, insurance organizations, mortgage teams, financial services businesses, and B2B SaaS operators that need more pipeline without adding fragmented tools and manual overhead.",
  },
  {
    question: "What does Hubbly replace?",
    answer: "Hubbly replaces disconnected outbound stacks that often include lead data vendors, enrichment tools, sequencing products, dialers, booking tools, AI copy tools, spreadsheet glue, and reporting dashboards.",
  },
  {
    question: "Is Hubbly an AI SDR platform?",
    answer: "Hubbly includes AI SDR-style capabilities, but it is broader than a single SDR product because it combines intelligence, execution, memory, and optimization in one operating system.",
  },
  {
    question: "Does Hubbly support specific industries?",
    answer: "Yes. Hubbly supports verticals such as insurance, mortgage, agencies, financial services, and B2B SaaS, with tailored workflows and specialized go-to-market logic.",
  },
  {
    question: "Does Hubbly work with our existing CRM and sales tools?",
    answer: "Yes. Hubbly is designed to layer on top of the systems you already use or replace parts of your stack over time. It connects with major CRMs and existing tools, so teams can start with their current setup, keep their process running, and then consolidate into Hubbly where it makes sense.",
  },
]

export function FAQSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const faqRef = useRef<HTMLDivElement>(null)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.from(headerRef.current.children, {
          y: 30,
          opacity: 0,
          stagger: 0.1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        })
      }

      if (faqRef.current) {
        gsap.from(faqRef.current.children, {
          y: 20,
          opacity: 0,
          stagger: 0.08,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: {
            trigger: faqRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="faq" className="relative py-24 md:py-32 px-4 md:pl-28 md:pr-12 border-t border-border/30">
      <div ref={headerRef} className="mb-12 md:mb-16">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">13 / FAQ</span>
        <h2 className="mt-4 md:mt-6 font-[var(--font-bebas)] text-4xl md:text-7xl tracking-tight">
          Common questions about Hubbly.
        </h2>
        <p className="mt-4 font-mono text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Quick answers to help you understand what Hubbly is, how it works, and whether it fits your business.
        </p>
      </div>

      <div ref={faqRef} className="max-w-3xl space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-border/50 bg-card/30"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-5 md:p-6 text-left"
            >
              <h3 className="font-mono text-sm md:text-base text-foreground pr-4">
                {faq.question}
              </h3>
              <span className={cn(
                "text-accent transition-transform duration-300 flex-shrink-0",
                openIndex === index && "rotate-45"
              )}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 3v10M3 8h10" />
                </svg>
              </span>
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-300",
                openIndex === index ? "max-h-96" : "max-h-0"
              )}
            >
              <p className="px-5 md:px-6 pb-5 md:pb-6 font-mono text-sm text-muted-foreground leading-relaxed">
                {faq.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
