/**
 * The problem — a two-column operating-flow comparison.
 *
 * Replaces the previous "93% of leads" stat block, which asserted a percentage
 * we can't source to our own data.
 *
 * The old side is muted and visually fragmented (dashed connectors, gray text);
 * the Hubbly side is connected and white/blue. Deliberately no red "bad"
 * styling and no illustrations — borders and states carry the contrast.
 */

import { Reveal } from "@/components/landing-interactions"
import { SectionHeading } from "@/components/voice/section"
import { problem } from "@/lib/voice-content"

function FlowColumn({
  label,
  steps,
  support,
  tone,
}: {
  label: string
  steps: readonly string[]
  support: string
  tone: "old" | "new"
}) {
  const isNew = tone === "new"

  return (
    <div
      className={`flex h-full flex-col border p-7 md:p-9 ${
        isNew ? "border-border bg-card" : "border-border/60 bg-background"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`size-1.5 rounded-full ${isNew ? "bg-accent" : "bg-muted-foreground"}`}
          aria-hidden="true"
        />
        <span
          className={`font-mono text-[11px] tracking-[0.18em] ${isNew ? "text-accent" : "text-muted-foreground/70"}`}
        >
          {label}
        </span>
      </div>

      <ol className="mt-7 flex flex-1 flex-col gap-0">
        {steps.map((step, index) => (
          <li key={step} className="flex flex-col">
            <span
              className={`text-[15px] leading-relaxed ${isNew ? "text-foreground" : "text-muted-foreground/70"}`}
            >
              {step}
            </span>
            {index < steps.length - 1 && (
              // Connector: solid and blue on the Hubbly side to read as one
              // continuous motion; dashed and gray on the old side to read as
              // a handoff that can drop.
              <span
                aria-hidden="true"
                className={`my-2 ml-1 h-5 w-px ${
                  isNew ? "bg-accent" : "border-l border-dashed border-border"
                }`}
              />
            )}
          </li>
        ))}
      </ol>

      <p
        className={`mt-8 border-t pt-6 text-sm leading-relaxed ${
          isNew ? "border-border text-muted-foreground" : "border-border/60 text-muted-foreground/70"
        }`}
      >
        {support}
      </p>
    </div>
  )
}

export function ProblemFlow() {
  return (
    <section id="why" className="scroll-mt-32 border-b border-border/60 bg-background px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1440px]">
        <Reveal>
          <SectionHeading
            eyebrow={problem.eyebrow}
            headline={problem.headline}
            body={problem.body}
            align="center"
          />
        </Reveal>

        <Reveal className="mt-16">
          <div className="mx-auto grid max-w-[1040px] grid-cols-1 gap-px bg-border md:grid-cols-2">
            <FlowColumn
              label={problem.oldWay.label}
              steps={problem.oldWay.steps}
              support={problem.oldWay.support}
              tone="old"
            />
            <FlowColumn
              label={problem.newWay.label}
              steps={problem.newWay.steps}
              support={problem.newWay.support}
              tone="new"
            />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
