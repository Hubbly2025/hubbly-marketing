/**
 * From website to working call team.
 *
 * Left: the five setup steps. Right: the website input expanding into a learned
 * business map and then a configured call team. Deliberately not a chatbot
 * prompt box — the input is shown as an intake field that produces structure.
 *
 * The URL shown is a placeholder domain in the mockup, not a real customer.
 */

import { Reveal } from "@/components/landing-interactions"
import { ExampleTag, SectionHeading } from "@/components/voice/section"
import { launch, launchSteps } from "@/lib/voice-content"

function BusinessMap() {
  return (
    <div className="border border-border/60 bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground/70">INTAKE</span>
        <ExampleTag label="EXAMPLE" />
      </div>

      {/* Website input */}
      <div className="mt-4 flex items-center gap-3 border border-border bg-secondary px-4 py-3">
        <span className="font-mono text-[11px] text-muted-foreground/70">https://</span>
        <span className="font-mono text-[12px] text-foreground">yourcompany.com</span>
        <span className="ml-auto size-1.5 rounded-full bg-accent" aria-hidden="true" />
      </div>

      <Connector />

      {/* Learned business */}
      <div className="border border-border/60 bg-background p-4">
        <span className="font-mono text-[10px] tracking-[0.16em] text-accent">BUSINESS LEARNED</span>
        <div className="mt-3 flex flex-wrap gap-2">
          {["OFFER", "ICP", "FAQS", "OBJECTIONS", "GOAL"].map((chip) => (
            <span
              key={chip}
              className="border border-border/60 px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-muted-foreground"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>

      <Connector />

      {/* Configured team */}
      <div className="border border-border/60 bg-background p-4">
        <span className="font-mono text-[10px] tracking-[0.16em] text-accent">CALL TEAM CONFIGURED</span>
        <dl className="mt-3 grid grid-cols-2 gap-y-2">
          {[
            ["ROLE", "Speed-to-lead"],
            ["AUDIENCE", "New inbound"],
            ["CADENCE", "Approved"],
            ["CALENDAR", "Connected"],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5">
              <dt className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground/70">{label}</dt>
              <dd className="font-mono text-[11px] text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <Connector />

      <div className="flex items-center gap-2 border border-border bg-secondary px-4 py-3">
        <span className="animate-pulse size-1.5 rounded-full bg-accent" aria-hidden="true" />
        <span className="font-mono text-[11px] tracking-[0.14em] text-foreground">READY FOR TEST</span>
      </div>
    </div>
  )
}

function Connector() {
  return <div aria-hidden="true" className="mx-auto my-3 h-4 w-px bg-muted" />
}

export function LaunchFlow() {
  return (
    <section id="launch" className="scroll-mt-32 bg-background px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1440px]">
        <Reveal>
          <SectionHeading eyebrow={launch.eyebrow} headline={launch.headline} body={launch.body} />
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_420px] lg:gap-16">
          <Reveal>
            <ol className="flex flex-col">
              {launchSteps.map((step, index) => (
                <li
                  key={step.index}
                  className={`flex gap-6 py-6 ${index > 0 ? "border-t border-border/60" : ""}`}
                >
                  <span className="font-mono text-[11px] tracking-[0.16em] text-accent tnum">
                    {step.index}
                  </span>
                  <div className="max-w-[520px]">
                    <h3 className="font-mono text-[12px] font-bold tracking-[0.12em] text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground/70">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal>
            <BusinessMap />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
