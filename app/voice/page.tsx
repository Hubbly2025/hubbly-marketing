import type { Metadata } from "next"
import { StickyHeader } from "@/components/sticky-header"
import { SideNav } from "@/components/side-nav"
import { FloatingCTA } from "@/components/floating-cta"
import { FooterSection } from "@/components/footer-section"
import { Reveal } from "@/components/autopilot/reveal"
import LazyDemo from "@/components/lazy-demo"
import { pageMetadata, productJsonLd } from "@/lib/seo"
import { PRODUCT_LINES_TAGLINE } from "@/lib/products"

const appJsonLd = productJsonLd({
  name: "Hubbly Voice",
  description:
    "Hubbly Voice is the conversation layer of Hubbly — it reaches buyers, handles the conversation, logs the outcome, and sets the next step in motion. " +
    PRODUCT_LINES_TAGLINE,
  path: "/voice",
})

export const metadata: Metadata = pageMetadata({
  title: "Hubbly Voice — Your calling team, running itself",
  description:
    "Voice is the conversation layer of Hubbly — it reaches buyers, handles the conversation, logs the outcome, and sets the next approved step in motion, from the same shared context as the rest of the system.",
  path: "/voice",
})

const conversationFlow = [
  { step: "01", action: "Reach", desc: "Contact while intent is fresh", timing: "Minutes, not hours" },
  { step: "02", action: "Qualify", desc: "Real conversation determines fit", timing: "Live context" },
  { step: "03", action: "Route", desc: "Book, handoff, or sequence", timing: "Automatic" },
  { step: "04", action: "Log", desc: "Transcript + outcome + next step", timing: "Zero admin" },
]

const dispositions = [
  { label: "Interested → Book meeting", outcome: "win" },
  { label: "Qualified → Hand to rep", outcome: "win" },
  { label: "Callback → Schedule retry", outcome: "nurture" },
  { label: "No answer → Next attempt", outcome: "nurture" },
  { label: "Voicemail → Continue sequence", outcome: "nurture" },
  { label: "Not a fit → Close cleanly", outcome: "close" },
  { label: "Do not call → Suppress", outcome: "close" },
]

const systemCapabilities = [
  {
    title: "Speed to lead",
    desc: "Voice reaches the buyer the moment intent surfaces — the window most teams miss.",
    metric: "Minutes",
  },
  {
    title: "Context-aware calls",
    desc: "Every conversation starts with real buyer context pulled from the same system that identified them.",
    metric: "Shared record",
  },
  {
    title: "Outcome on every call",
    desc: "No guessing. Every call logs a clear disposition that drives the next workflow step.",
    metric: "100% coverage",
  },
  {
    title: "Meeting booking",
    desc: "Qualified conversations move straight into the calendar without a handoff gap.",
    metric: "Direct to cal",
  },
  {
    title: "Compliance enforced",
    desc: "Suppression, consent, and timing rules run before the call, not cleaned up after.",
    metric: "TCPA + DNC",
  },
  {
    title: "Always-on execution",
    desc: "The sequence runs on schedule so no lead is dropped after one attempt.",
    metric: "Full cadence",
  },
]

const controlPoints = [
  { label: "Workflow approval required", icon: "✓" },
  { label: "Suppression list enforced", icon: "✓" },
  { label: "Call recording on by default", icon: "✓" },
  { label: "Time-zone rules automatic", icon: "✓" },
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
        text: "Voice is the conversation layer of Hubbly. It reaches the buyer, handles the conversation with real context, logs a clear outcome, and sets the next approved step in motion — all from the same shared system as the rest of Hubbly.",
      },
    },
    {
      "@type": "Question",
      name: "Will it dial without my approval?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. You approve the workflow before anything dials. Suppression, consent, and timing rules are enforced before the call, and every call is recorded and logged.",
      },
    },
  ],
}

export default function VoicePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />

      <main className="relative min-h-screen bg-background">
        <StickyHeader />
        <SideNav />
        <FloatingCTA />
        <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />
        <div className="noise-overlay" aria-hidden="true" />

        <div className="relative z-10">
          {/* DEMO HERO */}
          <section className="px-4 pt-24 pb-8 md:pl-28 md:pr-12 md:pt-28">
            <div className="mx-auto w-full max-w-[1400px]">
              <LazyDemo
                src="/demos/hubbly-agent-demos.html?demo=voice"
                title="Hubbly Voice demo"
                aspect={null}
                className="h-[min(80vh,860px)] border border-border"
              />
            </div>
          </section>

          {/* HERO */}
          <header className="px-4 pt-16 pb-20 md:pl-28 md:pr-12 md:pt-20 md:pb-32">
            <div className="mx-auto w-full max-w-[1120px]">
              <Reveal>
                <span className="block font-mono text-[10px] uppercase tracking-[0.24em] text-voice">
                  Voice · Conversation layer
                </span>
              </Reveal>
              <Reveal delay={80}>
                <h1 className="mt-5 font-[var(--font-bebas)] text-[clamp(3rem,8vw,7rem)] leading-[0.92] tracking-tight">
                  Your calling team,
                  <br />
                  <span className="text-voice">running itself.</span>
                </h1>
              </Reveal>
              <Reveal delay={160}>
                <p className="mt-6 max-w-[640px] text-lg leading-relaxed text-muted-foreground">
                  Voice reaches buyers, handles the conversation, logs the outcome, and sets the next approved
                  step in motion. Same shared context as the rest of the growth engine.
                </p>
              </Reveal>
              <Reveal delay={240}>
                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <a
                    href="/#audit"
                    className="inline-flex h-12 items-center bg-voice px-6 font-mono text-sm font-semibold uppercase tracking-widest text-background transition-all hover:-translate-y-0.5 hover:bg-voice/90"
                  >
                    Run free audit
                  </a>
                  <a
                    href="/demo"
                    className="inline-flex h-12 items-center border border-border px-6 font-mono text-sm uppercase tracking-widest text-foreground transition-all hover:border-voice"
                  >
                    Talk to us
                  </a>
                </div>
              </Reveal>
            </div>
          </header>

          {/* CONVERSATION FLOW */}
          <section className="border-y border-border/30 bg-card/20 px-4 py-20 md:pl-28 md:pr-12 md:py-28">
            <div className="mx-auto w-full max-w-[1120px]">
              <Reveal>
                <span className="block font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  The conversation workflow
                </span>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="mt-4 font-[var(--font-bebas)] text-5xl leading-tight tracking-tight md:text-6xl">
                  It works the full sequence,
                  <br />
                  not just the dial.
                </h2>
              </Reveal>
              <Reveal delay={160}>
                <p className="mt-4 max-w-[600px] text-base leading-relaxed text-muted-foreground">
                  A single call rarely resolves a lead. Voice runs the cadence until every conversation reaches
                  an outcome.
                </p>
              </Reveal>
              <div className="mt-12 grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-4">
                {conversationFlow.map((item, i) => (
                  <Reveal key={item.step} delay={240 + i * 60}>
                    <div className="bg-card p-6">
                      <div className="flex items-baseline gap-3">
                        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-voice">
                          {item.step}
                        </span>
                        <h3 className="font-[var(--font-bebas)] text-xl tracking-tight">{item.action}</h3>
                      </div>
                      <p className="mt-2 font-mono text-[13px] leading-relaxed text-muted-foreground">
                        {item.desc}
                      </p>
                      <div className="mt-3 border-t border-border/40 pt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground/70">
                        {item.timing}
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* DISPOSITIONS */}
          <section className="px-4 py-20 md:pl-28 md:pr-12 md:py-28">
            <div className="mx-auto w-full max-w-[1120px]">
              <Reveal>
                <span className="block font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  Outcome-driven
                </span>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="mt-4 font-[var(--font-bebas)] text-5xl leading-tight tracking-tight md:text-6xl">
                  Every call ends in an outcome.
                  <br />
                  Every outcome drives the next move.
                </h2>
              </Reveal>
              <Reveal delay={160}>
                <p className="mt-4 max-w-[600px] text-base leading-relaxed text-muted-foreground">
                  Voice logs a clear disposition on every conversation. Interested books. No answer retries. Not
                  a fit closes.
                </p>
              </Reveal>
              <Reveal delay={240}>
                <div className="mt-10 flex flex-wrap gap-3">
                  {dispositions.map((d) => (
                    <div
                      key={d.label}
                      className={`border px-4 py-2.5 font-mono text-[12px] tracking-wide transition-transform hover:-translate-y-0.5 ${
                        d.outcome === "win"
                          ? "border-voice/40 bg-voice/10 text-voice"
                          : d.outcome === "nurture"
                            ? "border-border bg-card text-muted-foreground"
                            : "border-border/60 bg-secondary text-muted-foreground/70"
                      }`}
                    >
                      {d.label}
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </section>

          {/* CAPABILITIES */}
          <section className="border-y border-border/30 bg-card/20 px-4 py-20 md:pl-28 md:pr-12 md:py-28">
            <div className="mx-auto w-full max-w-[1120px]">
              <Reveal>
                <span className="block font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  What Voice delivers
                </span>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="mt-4 font-[var(--font-bebas)] text-5xl leading-tight tracking-tight md:text-6xl">
                  A conversation engine,
                  <br />
                  inside the system.
                </h2>
              </Reveal>
              <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {systemCapabilities.map((cap, i) => (
                  <Reveal key={cap.title} delay={160 + i * 60}>
                    <div className="group border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-voice/40">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="font-[var(--font-bebas)] text-xl tracking-tight">{cap.title}</h3>
                        <span className="flex-none font-mono text-[9px] uppercase tracking-[0.12em] text-voice">
                          {cap.metric}
                        </span>
                      </div>
                      <p className="mt-3 font-mono text-[13px] leading-relaxed text-muted-foreground">
                        {cap.desc}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>

              {/* CONTROL BAR */}
              <Reveal delay={400}>
                <div className="mt-12 border border-voice/40 bg-voice/5 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-none">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-voice">
                        <path
                          d="M10 2l7 3v4.5c0 4-2.8 7.2-7 8.5-4.2-1.3-7-4.5-7-8.5V5l7-3z"
                          stroke="currentColor"
                          strokeWidth="1.3"
                        />
                        <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-mono text-sm font-semibold uppercase tracking-wider text-foreground">
                        Human control + compliance built in
                      </h4>
                      <p className="mt-2 max-w-[600px] font-mono text-[13px] leading-relaxed text-muted-foreground">
                        You approve the workflow before anything dials. Suppression, consent, and timing rules
                        are enforced before the call, not cleaned up after it.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {controlPoints.map((p) => (
                          <span
                            key={p.label}
                            className="border border-voice/30 bg-background/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-voice"
                          >
                            {p.icon} {p.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          {/* WHERE IT FITS */}
          <section className="px-4 py-20 md:pl-28 md:pr-12 md:py-28">
            <div className="mx-auto w-full max-w-[1120px]">
              <Reveal>
                <span className="block font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  Where Voice fits
                </span>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="mt-4 font-[var(--font-bebas)] text-5xl leading-tight tracking-tight md:text-6xl">
                  Voice is the conversation layer.
                  <br />
                  The growth engine is the whole system.
                </h2>
              </Reveal>
              <Reveal delay={160}>
                <p className="mt-4 max-w-[640px] text-base leading-relaxed text-muted-foreground">
                  Signal identifies the buyer. Rank captures the demand. Voice handles the conversation. The rest
                  of Hubbly turns outcomes into the next coordinated action.
                </p>
              </Reveal>
              <Reveal delay={240}>
                <div className="mt-8 flex flex-wrap gap-6 font-mono text-xs uppercase tracking-wider">
                  <a
                    href="/"
                    className="border-b border-accent pb-1 text-accent transition-colors hover:text-accent/80"
                  >
                    See the full system →
                  </a>
                  <a
                    href="/architecture"
                    className="border-b border-accent pb-1 text-accent transition-colors hover:text-accent/80"
                  >
                    System architecture →
                  </a>
                </div>
              </Reveal>
            </div>
          </section>

          {/* FINAL CTA */}
          <section className="border-t border-border/30 bg-card/20 px-4 py-24 md:pl-28 md:pr-12 md:py-40">
            <div className="mx-auto w-full max-w-4xl text-center">
              <Reveal>
                <span className="block font-mono text-[10px] uppercase tracking-[0.24em] text-accent">
                  Your turn
                </span>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="mt-5 font-[var(--font-bebas)] text-[clamp(2.5rem,7vw,5rem)] leading-[0.92] tracking-tight">
                  Put your calling
                  <br />
                  <span className="text-voice">on autopilot.</span>
                </h2>
              </Reveal>
              <Reveal delay={160}>
                <p className="mx-auto mt-6 max-w-xl font-mono text-sm leading-relaxed text-muted-foreground">
                  Drop your URL and Hubbly maps your buyers, builds the calling workflow, and shows you the
                  conversations it would run — before a single dial goes live.
                </p>
              </Reveal>
              <Reveal delay={240}>
                <form
                  action="/api/audit/form"
                  method="post"
                  className="mx-auto mt-10 flex max-w-[560px] flex-col items-stretch gap-3 sm:flex-row"
                >
                  <input
                    name="url"
                    type="text"
                    inputMode="url"
                    required
                    placeholder="yourcompany.com"
                    aria-label="Your website URL"
                    autoComplete="off"
                    className="min-h-[52px] flex-1 border border-border bg-background px-5 py-4 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-voice focus:outline-none focus:ring-1 focus:ring-voice"
                  />
                  <button
                    type="submit"
                    className="min-h-[52px] whitespace-nowrap bg-accent px-8 py-4 font-[var(--font-bebas)] text-lg tracking-wide text-accent-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(255,107,53,0.32)]"
                  >
                    Run free audit
                  </button>
                </form>
              </Reveal>
              <Reveal delay={240}>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground/60">
                  Free · No credit card · Nothing dials without your approval
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
