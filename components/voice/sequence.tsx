"use client"

/**
 * The sequence — seven steps, explorable by click rather than hover only, so it
 * works on touch and by keyboard. Real buttons in a tablist, not divs.
 *
 * Horizontal rail on desktop, vertical stack on mobile. The selected step's
 * detail renders in one panel below rather than inside each cell, which keeps
 * the rail scannable and avoids seven competing paragraphs.
 */

import { useState } from "react"

import { Reveal } from "@/components/landing-interactions"
import { SectionHeading } from "@/components/voice/section"
import { allowedItems } from "@/lib/voice-claims"
import { sequence, sequenceSteps } from "@/lib/voice-content"

export function Sequence() {
  const steps = allowedItems(sequenceSteps)
  const [activeIndex, setActiveIndex] = useState(0)
  const active = steps[activeIndex]

  return (
    <section
      id="how-it-works"
      className="scroll-mt-32 border-y border-border/60 bg-card px-6 py-24 md:py-32"
    >
      <div className="mx-auto max-w-[1440px]">
        <Reveal>
          <SectionHeading eyebrow={sequence.eyebrow} headline={sequence.headline} body={sequence.body} />
        </Reveal>

        <Reveal className="mt-16">
          <div
            role="tablist"
            aria-label="Call sequence steps"
            className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-7"
          >
            {steps.map((step, index) => {
              const selected = index === activeIndex
              return (
                <button
                  key={step.id}
                  type="button"
                  role="tab"
                  id={`seq-tab-${step.id}`}
                  aria-selected={selected}
                  aria-controls="seq-panel"
                  onClick={() => setActiveIndex(index)}
                  className={`flex min-h-[110px] flex-col items-start gap-3 p-5 text-left transition-colors ${
                    selected ? "bg-background" : "bg-card hover:bg-background/60"
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] tracking-[0.16em] tnum ${
                      selected ? "text-accent" : "text-muted-foreground/70"
                    }`}
                  >
                    {step.index}
                  </span>
                  <span
                    className={`font-mono text-[11px] leading-relaxed tracking-[0.1em] ${
                      selected ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.title}
                  </span>
                  {/* Progress underline for the selected step. */}
                  <span
                    aria-hidden="true"
                    className={`mt-auto h-px w-full ${selected ? "bg-accent" : "bg-transparent"}`}
                  />
                </button>
              )
            })}
          </div>

          <div
            role="tabpanel"
            id="seq-panel"
            aria-labelledby={`seq-tab-${active.id}`}
            className="border border-t-0 border-border/60 bg-background p-7 md:p-10"
          >
            <span className="font-mono text-[10px] tracking-[0.16em] text-accent tnum">
              {active.index}
            </span>
            <p className="mt-4 max-w-[680px] text-[17px] leading-relaxed text-foreground">
              {active.description}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
