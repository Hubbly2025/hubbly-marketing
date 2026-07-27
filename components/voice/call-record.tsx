/**
 * Every call becomes operating data.
 *
 * Two panes: a short transcript excerpt on the left, the structured record it
 * produced on the right. The point of the section is the arrow between them —
 * the conversation is only finished when the record and next step are correct.
 *
 * The transcript is a written example, not a recording claim, and the contact is
 * fictional.
 */

import { Reveal } from "@/components/landing-interactions"
import { ExampleTag, SectionHeading } from "@/components/voice/section"
import { record } from "@/lib/voice-content"

export function CallRecord() {
  return (
    <section id="record" className="scroll-mt-32 border-y border-border/60 bg-card px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1440px]">
        <Reveal>
          <SectionHeading
            eyebrow={record.eyebrow}
            headline={record.headline}
            body={record.body}
            align="center"
          />
        </Reveal>

        <Reveal className="mt-16">
          <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-px bg-border lg:grid-cols-2">
            {/* Transcript */}
            <div className="bg-background p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground/70">TRANSCRIPT</span>
                <ExampleTag label="EXAMPLE CALL" />
              </div>
              <div className="mt-6 flex flex-col gap-5">
                {record.transcript.map(([speaker, line]) => (
                  <div key={line} className="flex flex-col gap-1.5">
                    <span
                      className={`font-mono text-[9px] tracking-[0.16em] ${
                        speaker === "CALL TEAM" ? "text-accent" : "text-muted-foreground/70"
                      }`}
                    >
                      {speaker}
                    </span>
                    <p className="text-[14px] leading-relaxed text-muted-foreground">{line}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex items-center gap-3 border-t border-border/60 pt-5">
                <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground/70">
                  SUMMARY GENERATED
                </span>
                <span className="h-px flex-1 bg-border" aria-hidden="true" />
                <span className="font-mono text-[10px] tracking-[0.14em] text-accent">→</span>
              </div>
            </div>

            {/* Structured record */}
            <div className="bg-background p-6 md:p-8">
              <span className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground/70">OPERATING RECORD</span>
              <dl className="mt-6 flex flex-col">
                {record.fields.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between gap-6 border-b border-border/60 py-3"
                  >
                    <dt className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground/70">{label}</dt>
                    <dd className="text-right text-[13px] text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Reveal>

        <Reveal className="mt-12">
          <p className="mx-auto max-w-[620px] text-center text-[15px] leading-relaxed text-muted-foreground">
            {record.support}
          </p>
        </Reveal>
      </div>
    </section>
  )
}
