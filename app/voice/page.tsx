import type { Metadata } from "next"
import { StickyHeader } from "@/components/sticky-header"
import { SideNav } from "@/components/side-nav"
import { FloatingCTA } from "@/components/floating-cta"
import { FooterSection } from "@/components/footer-section"
import { VoiceCall } from "@/components/voice/voice-call"
import { Reveal } from "@/components/autopilot/reveal"

export const metadata: Metadata = {
  title: "Hubbly Voice — Your calling team, running itself",
  description:
    "The Voice agent runs your outbound calling cadences — dials, qualifies, logs the outcome, and schedules the follow-up. The work of a BDR desk, automated and approval-gated.",
  alternates: { canonical: "https://hubbly.io/voice" },
}

const cadence = [
  { n: "STEP 01", title: "First call", copy: "Dials the new lead within minutes of assignment. Speed to lead, every time.", wait: "DAY 0" },
  { n: "STEP 02", title: "Follow-up", copy: "No answer? It tries again at a better time, time-zone aware.", wait: "DAY 1" },
  { n: "STEP 03", title: "Value touch", copy: "Connects and qualifies, or leaves the next step in the sequence.", wait: "DAY 3" },
  { n: "STEP 04", title: "Persistence", copy: "Keeps working the lead on cadence until a clear outcome lands.", wait: "DAY 5" },
  { n: "STEP 05", title: "Resolve", copy: "Qualified, booked, or closed out — every lead reaches a decision.", wait: "DAY 7" },
]

const dispositions: { label: string; win?: boolean }[] = [
  { label: "Interested → book", win: true },
  { label: "Qualified → handoff", win: true },
  { label: "Callback → reschedule" },
  { label: "No answer → retry" },
  { label: "Voicemail → next step" },
  { label: "Wrong number → flag" },
  { label: "Not a fit → close" },
  { label: "Do not call → suppress" },
]

const capabilities = [
  {
    title: "Calls on a real conversation",
    copy: "Natural-voice outbound that qualifies, handles objections, and reaches the outcome — not a robocall script.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M5 4h4l2 5-3 2a12 12 0 005 5l2-3 5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Logs the outcome for you",
    copy: "Disposition, notes, and recording captured on every call. An auditable history with zero rep data entry.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Books the meeting",
    copy: "An interested buyer gets a calendar invite on the spot, dropped straight onto the right rep's calendar.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="12" cy="15" r="2.2" className="fill-green-500" />
      </svg>
    ),
  },
  {
    title: "Knows who owns the lead",
    copy: "Round-robin assignment and first-contact-wins ownership, so the right rep gets credit and the buyer never hears from two people.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="9" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.4" />
        <path d="M3 20c1-3.6 3.7-5 6-5s5 1.4 6 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M17 9l2 2 3-3.5" className="stroke-green-500" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Speed to lead, always",
    copy: "Dials within minutes of a lead landing — the single biggest lever on contact rate, run automatically around the clock.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3v18M5 8l7-5 7 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 8v8l7 5 7-5V8" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "You stay in control",
    copy: "Managers set the cadence and the script. Reps confirm outcomes. The agent runs the dialing, not the strategy.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="11" width="18" height="9" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M7 11V8a5 5 0 0110 0v3" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
]

const kpis = [
  {
    value: "Speed to lead",
    label: "Minutes, not days",
    desc: "Dials the moment a lead lands — the lever most teams miss because reps are busy.",
  },
  {
    value: "Contact rate",
    label: "Every lead, every step",
    desc: "Works the full cadence on schedule, so no lead is dropped after one attempt.",
  },
  {
    value: "Qualification rate",
    label: "Outcome on every call",
    desc: "A clean disposition on every dial means your pipeline reflects reality, not guesswork.",
  },
]

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What does Hubbly Voice do?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Voice runs your outbound calling cadences end to end — it dials the lead, qualifies on a real conversation, logs a sales-grade disposition, and schedules the next touch automatically.",
      },
    },
    {
      "@type": "Question",
      name: "Will it dial without my approval?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. You approve the cadence and script before anything dials. Suppression and consent rules are enforced before the call, and every call is recorded and logged.",
      },
    },
  ],
}

export default function VoicePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <main className="relative min-h-screen">
        <StickyHeader />
        <SideNav />
        <FloatingCTA />
        <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />

        <div className="relative z-10">
          {/* HERO */}
          <header id="hero" className="flex min-h-[90vh] items-center px-4 pt-28 pb-16 md:pl-28 md:pr-12">
            <div className="mx-auto w-full max-w-[1060px]">
              <Reveal as="span" className="block font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
                Voice · the calling agent
              </Reveal>
              <Reveal delay={120}>
                <h1 className="mt-6 font-[var(--font-bebas)] text-5xl leading-[0.95] tracking-tight sm:text-7xl lg:text-[92px]">
                  Your calling team,
                  <br />
                  <span className="text-accent">running itself.</span>
                </h1>
              </Reveal>
              <Reveal delay={240}>
                <p className="mt-6 max-w-[600px] font-mono text-sm leading-relaxed text-muted-foreground md:text-base">
                  The Voice agent runs your outbound calling cadences end to end — dials the lead, qualifies on a real
                  conversation, logs the outcome, and schedules the next touch. The work of a BDR desk, on a system that
                  never skips a follow-up.
                </p>
              </Reveal>
              <Reveal delay={240}>
                <VoiceCall />
              </Reveal>
            </div>
          </header>

          {/* CADENCE */}
          <section className="px-4 py-24 md:py-32 md:pl-28 md:pr-12">
            <div className="mx-auto w-full max-w-[1060px]">
              <Reveal as="span" className="block font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
                Cadence, not one-off calls
              </Reveal>
              <Reveal delay={120}>
                <h2 className="mt-4 font-[var(--font-bebas)] text-4xl leading-[1.05] tracking-tight md:text-6xl">
                  It works the sequence,
                  <br />
                  not just the dial.
                </h2>
              </Reveal>
              <Reveal delay={240}>
                <p className="mt-4 max-w-[600px] font-mono text-sm leading-relaxed text-muted-foreground md:text-base">
                  A single call rarely closes a buyer. Voice runs the whole multi-step cadence on a schedule — and what
                  happens on each call decides what happens next.
                </p>
              </Reveal>
              <div className="mt-12 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
                {cadence.map((step, i) => (
                  <Reveal key={step.n} delay={120 + i * 80} className="bg-card p-6">
                    <span className="font-mono text-[10px] tracking-[0.14em] text-accent">{step.n}</span>
                    <h3 className="mb-[6px] mt-[10px] font-[var(--font-bebas)] text-base tracking-tight">{step.title}</h3>
                    <p className="font-mono text-[12px] leading-normal text-muted-foreground">{step.copy}</p>
                    <div className="mt-[9px] font-mono text-[9.5px] tracking-[0.06em] text-muted-foreground/60">
                      {step.wait}
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* DISPOSITION-DRIVEN */}
          <section className="border-y border-border/30 bg-card/40 px-4 py-24 md:py-32 md:pl-28 md:pr-12">
            <div className="mx-auto w-full max-w-[1060px]">
              <Reveal as="span" className="block font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
                Outcome-driven
              </Reveal>
              <Reveal delay={120}>
                <h2 className="mt-4 font-[var(--font-bebas)] text-4xl leading-[1.05] tracking-tight md:text-6xl">
                  Every call ends in an outcome.
                  <br />
                  Every outcome drives the next move.
                </h2>
              </Reveal>
              <Reveal delay={240}>
                <p className="mt-4 max-w-[600px] font-mono text-sm leading-relaxed text-muted-foreground md:text-base">
                  Voice logs a sales-grade disposition on every call — and the cadence reacts automatically. Interested
                  books a meeting. No answer schedules a retry. Not a fit closes the lead. Nothing falls through.
                </p>
              </Reveal>
              <Reveal delay={240}>
                <div className="mt-8 flex flex-wrap gap-2">
                  {dispositions.map((d) => (
                    <span
                      key={d.label}
                      className={cnDispo(d.win)}
                    >
                      {d.label}
                    </span>
                  ))}
                </div>
              </Reveal>
            </div>
          </section>

          {/* CAPABILITIES */}
          <section className="px-4 py-24 md:py-32 md:pl-28 md:pr-12">
            <div className="mx-auto w-full max-w-[1060px]">
              <Reveal as="span" className="block font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
                What it does
              </Reveal>
              <Reveal delay={120}>
                <h2 className="mt-4 font-[var(--font-bebas)] text-4xl leading-[1.05] tracking-tight md:text-6xl">
                  A BDR desk, in software.
                </h2>
              </Reveal>
              <div className="mt-12 grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
                {capabilities.map((cap, i) => (
                  <Reveal key={cap.title} delay={120 + (i % 3) * 80}>
                    <div className="group h-full border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40">
                      <div className="mb-[14px] text-accent">{cap.icon}</div>
                      <h3 className="mb-[7px] font-[var(--font-bebas)] text-lg tracking-tight">{cap.title}</h3>
                      <p className="font-mono text-[13px] leading-relaxed text-muted-foreground">{cap.copy}</p>
                    </div>
                  </Reveal>
                ))}
              </div>

              {/* COMPLIANCE */}
              <Reveal delay={240}>
                <div className="mt-12 flex flex-wrap items-center gap-4 border border-accent/40 bg-accent/10 p-7">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="flex-none text-accent" aria-hidden="true">
                    <path
                      d="M11 2l8 3.5v5c0 4.6-3.3 8.4-8 9.5-4.7-1.1-8-4.9-8-9.5v-5L11 2z"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                    <path d="M7.5 11l2.3 2.3L14.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <div className="flex-1">
                    <b className="font-mono text-base font-semibold text-foreground">
                      Compliance built in, not bolted on.
                    </b>
                    <p className="mt-1 max-w-[540px] font-mono text-[13.5px] leading-relaxed text-muted-foreground">
                      Suppression and consent rules are enforced before the dial, not after. The agent won&apos;t call a
                      number it shouldn&apos;t.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["TCPA AWARE", "DNC SUPPRESSION", "TIME-ZONE SAFE", "CALL RECORDING"].map((b) => (
                        <span
                          key={b}
                          className="rounded-md border border-accent/40 px-[9px] py-[5px] font-mono text-[10px] tracking-[0.1em] text-accent"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          {/* KPIs */}
          <section className="border-y border-border/30 bg-card/40 px-4 py-24 md:py-32 md:pl-28 md:pr-12">
            <div className="mx-auto w-full max-w-[1060px]">
              <Reveal as="span" className="block font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
                What it moves
              </Reveal>
              <Reveal delay={120}>
                <h2 className="mt-4 font-[var(--font-bebas)] text-4xl leading-[1.05] tracking-tight md:text-6xl">
                  The numbers a calling team
                  <br />
                  is measured on.
                </h2>
              </Reveal>
              <div className="mt-12 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-3">
                {kpis.map((kpi, i) => (
                  <Reveal key={kpi.value} delay={120 + i * 80} className="bg-card p-7">
                    <div className="font-[var(--font-bebas)] text-2xl font-bold tracking-tight md:text-[34px]">
                      {kpi.value}
                    </div>
                    <div className="mt-[6px] font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground/60">
                      {kpi.label}
                    </div>
                    <p className="mt-2 font-mono text-[13px] leading-normal text-muted-foreground">{kpi.desc}</p>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* WHERE IT FITS */}
          <section className="px-4 py-24 md:py-32 md:pl-28 md:pr-12">
            <div className="mx-auto w-full max-w-[1060px]">
              <Reveal as="span" className="block font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
                Where it fits
              </Reveal>
              <Reveal delay={120}>
                <h2 className="mt-4 font-[var(--font-bebas)] text-4xl leading-[1.05] tracking-tight md:text-6xl">
                  Voice is one agent.
                  <br />
                  The team is the whole OS.
                </h2>
              </Reveal>
              <Reveal delay={240}>
                <p className="mt-4 max-w-[640px] font-mono text-sm leading-relaxed text-muted-foreground md:text-base">
                  Signal finds your buyers. Write sends the outreach. Voice makes the calls and books the meetings. Track
                  learns from every outcome. One shared memory — so the call already knows what the email said, and the
                  next cycle starts smarter.
                </p>
              </Reveal>
              <Reveal delay={240}>
                <div className="mt-7 flex flex-wrap gap-7 font-mono text-xs tracking-[0.1em]">
                  <a href="/architecture" className="border-b border-accent/40 pb-[2px] text-accent transition-colors hover:text-accent/80">
                    SEE THE ARCHITECTURE →
                  </a>
                  <a href="/" className="border-b border-accent/40 pb-[2px] text-accent transition-colors hover:text-accent/80">
                    SEE THE FULL OS →
                  </a>
                </div>
              </Reveal>
            </div>
          </section>

          {/* CLOSE */}
          <section id="audit" className="border-t border-border/30 bg-card/20 px-4 py-24 md:py-40 md:pl-28 md:pr-12">
            <div className="mx-auto w-full max-w-4xl text-center">
              <Reveal as="span" className="block font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
                Your turn
              </Reveal>
              <Reveal delay={120}>
                <h2 className="mt-5 font-[var(--font-bebas)] text-4xl leading-[0.95] tracking-tight md:text-7xl">
                  Put your calling
                  <br />
                  <span className="text-accent">on autopilot.</span>
                </h2>
              </Reveal>
              <Reveal delay={240}>
                <p className="mx-auto mt-5 max-w-xl font-mono text-xs leading-relaxed text-muted-foreground md:text-sm">
                  Drop your URL and Hubbly maps your buyers, builds the cadence, and shows you the calls it would run —
                  you approve before a single dial.
                </p>
              </Reveal>
              <Reveal delay={360}>
                <form
                  action="/api/audit/form"
                  method="post"
                  className="mx-auto mt-11 flex max-w-[520px] flex-col items-stretch gap-3 sm:flex-row"
                >
                  <input
                    name="url"
                    type="text"
                    inputMode="url"
                    required
                    placeholder="yourcompany.com"
                    aria-label="Your website URL"
                    autoComplete="off"
                    className="min-h-[52px] flex-1 border border-border bg-background px-5 py-4 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 transition-all duration-200 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <button
                    type="submit"
                    className="min-h-[52px] whitespace-nowrap bg-accent px-8 py-4 font-[var(--font-bebas)] text-lg tracking-wide text-accent-foreground transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_10px_36px_rgba(255,107,53,0.3)]"
                  >
                    Run free audit
                  </button>
                </form>
              </Reveal>
              <Reveal delay={360}>
                <p className="mt-4 font-mono text-[10.5px] tracking-[0.06em] text-muted-foreground/60">
                  FREE · NO CREDIT CARD · NOTHING DIALS WITHOUT YOUR APPROVAL
                </p>
              </Reveal>
            </div>
          </section>

          <FooterSection />
        </div>
      </main>
    </>
  )
}

function cnDispo(win?: boolean) {
  return [
    "rounded-[7px] border px-[13px] py-2 font-mono text-[11px] tracking-[0.04em]",
    win ? "border-green-500/40 text-green-500" : "border-border text-muted-foreground",
  ].join(" ")
}
