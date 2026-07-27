/**
 * Outcome analytics.
 *
 * Metric names with no figures attached. Publishing numbers here would read as
 * Hubbly's real performance, and we have none to cite — so the section sells
 * what gets measured, not fabricated results.
 *
 * The bar visual is monochrome with a single blue highlight, driven by fixed
 * proportions purely as shape. It carries no units and is labelled EXAMPLE DATA.
 */

import { Reveal } from "@/components/landing-interactions"
import { ExampleTag, SectionHeading } from "@/components/voice/section"
import { analytics } from "@/lib/voice-content"

/** Shape only — no scale, no units, no implied result. */
const bars = [38, 52, 46, 64, 58, 72, 66, 81]

export function Analytics() {
  return (
    <section id="analytics" className="scroll-mt-32 bg-background px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1440px]">
        <Reveal>
          <SectionHeading
            eyebrow={analytics.eyebrow}
            headline={analytics.headline}
            body={analytics.body}
          />
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-px bg-border lg:grid-cols-[1fr_400px]">
          {/* Metric list */}
          <Reveal>
            <div className="h-full bg-card p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground/70">
                  WHAT GETS MEASURED
                </span>
                <ExampleTag label={analytics.exampleLabel} />
              </div>
              <ul className="mt-6 grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
                {analytics.metrics.map((metric) => (
                  <li
                    key={metric}
                    className="flex items-center gap-3 bg-card px-4 py-4 font-mono text-[11px] leading-relaxed tracking-[0.1em] text-muted-foreground"
                  >
                    <span className="size-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                    {metric}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Trend shape */}
          <Reveal>
            <div className="flex h-full flex-col bg-card p-6 md:p-8">
              <span className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground/70">
                OUTCOME TREND
              </span>
              <div
                className="mt-8 flex flex-1 items-end gap-2"
                role="img"
                aria-label="Example bar chart showing an upward trend in call outcomes over time. Illustrative shape only, not real data."
              >
                {bars.map((height, index) => (
                  <div
                    key={index}
                    style={{ height: `${height}%` }}
                    className={`flex-1 ${
                      index === bars.length - 1 ? "bg-accent" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4">
                <span className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground/70">EARLIER</span>
                <span className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground/70">LATEST</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
