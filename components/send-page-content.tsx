import { StickyHeader } from "@/components/sticky-header"
import { SideNav } from "@/components/side-nav"
import { FloatingCTA } from "@/components/floating-cta"
import { FooterSection } from "@/components/footer-section"
import { Reveal } from "@/components/autopilot/reveal"
import LazyDemo from "@/components/lazy-demo"

const pipelineStages = [
  { n: "01", label: "Discover", status: "done", desc: "Finds the leads" },
  { n: "02", label: "Score", status: "done", desc: "Ranks by priority" },
  { n: "03", label: "Write", status: "done", desc: "Drafts the copy" },
  { n: "04", label: "Send", status: "active", desc: "Sequences + delivers" },
  { n: "05", label: "Book", status: "next", desc: "Takes the reply" },
]

const engineCapabilities = [
  {
    n: "01",
    title: "Sequencing",
    desc: "Multi-step sequences with stop-on-reply and behavior-based branching. Send decides when each step fires and when to pull someone out.",
    tech: ["stop_on_reply", "branch_on_open", "step_delay"],
  },
  {
    n: "02",
    title: "Deliverability",
    desc: "Domain warming, inbox rotation, and SPF/DKIM/DMARC handled as infrastructure — not a separate tool you configure and babysit.",
    tech: ["warming", "rotation", "auth", "bounce handling"],
  },
  {
    n: "03",
    title: "Reply handling",
    desc: "Replies are read for intent. Warm ones are handed to Book to put a meeting on the calendar; the rest stop the sequence cleanly.",
    tech: ["intent_detected", "handoff: book"],
  },
  {
    n: "04",
    title: "Control + provenance",
    desc: "Drafts by default, full send history, provenance on every message. You can see exactly what went out, to whom, and why.",
    tech: ["draft_first", "audit_trail", "provenance"],
  },
]

const standaloneToolStack = [
  { layer: "Lead source", work: "export & import" },
  { layer: "Your CRM", work: "sync by hand" },
  { layer: "A writer", work: "copy elsewhere" },
  { layer: "Warmup tool", work: "configure & wait" },
  { layer: "A spreadsheet", work: "track replies" },
]

const comparisonMatrix = [
  {
    capability: "Finds the leads",
    send: { has: true, note: "Built in · Discover" },
    standalone: { has: false, note: "Not included" },
  },
  {
    capability: "Scores & prioritizes",
    send: { has: true, note: "Built in · Score" },
    standalone: { has: false, note: "Not included" },
  },
  {
    capability: "Writes the copy",
    send: { has: true, note: "Built in · Write" },
    standalone: { has: false, note: "You bring it" },
  },
  {
    capability: "Sequencing",
    send: { has: true, note: "Yes" },
    standalone: { has: true, note: "Yes" },
  },
  {
    capability: "Deliverability",
    send: { has: true, note: "Yes" },
    standalone: { has: true, note: "Yes" },
  },
  {
    capability: "Books the meeting",
    send: { has: true, note: "Built in · Book" },
    standalone: { has: false, note: "Not included" },
  },
  {
    capability: "One system, one record",
    send: { has: true, note: "Yes" },
    standalone: { has: false, note: "Stitched together" },
  },
]

export function SendPageContent() {
  return (
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
              src="/demos/hubbly-agent-demos.html?demo=send"
              title="Hubbly Send demo"
              aspect={null}
              className="h-[min(80vh,860px)] border border-border"
            />
          </div>
        </section>

        {/* HERO */}
        <header className="px-4 pt-16 pb-20 md:pl-28 md:pr-12 md:pt-20 md:pb-32">
          <div className="mx-auto w-full max-w-[1120px]">
            <Reveal>
              <span className="block font-mono text-[10px] uppercase tracking-[0.24em] text-send">
                Send · Outbound layer
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-5 font-[var(--font-bebas)] text-[clamp(3rem,8vw,7rem)] leading-[0.92] tracking-tight">
                Cold email,
                <br />
                <span className="text-send">built in.</span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 max-w-[640px] text-lg leading-relaxed text-muted-foreground">
                Most sending tools make you bring the leads and write the copy.{" "}
                <strong className="font-medium text-foreground">Send already has both</strong> — fed straight
                from the pipeline, with deliverability handled.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <a
                  href="/#audit"
                  className="inline-flex h-12 items-center bg-accent px-6 font-mono text-sm font-semibold uppercase tracking-widest text-accent-foreground transition-all hover:-translate-y-0.5 hover:bg-accent/90"
                >
                  Start free
                </a>
                <a
                  href="/demo"
                  className="inline-flex h-12 items-center border border-border px-6 font-mono text-sm uppercase tracking-widest text-foreground transition-all hover:border-send"
                >
                  Talk to us
                </a>
                <span className="font-mono text-xs text-muted-foreground">
                  no list uploads · no separate tool
                </span>
              </div>
            </Reveal>
          </div>
        </header>

        {/* PIPELINE CONTEXT */}
        <section className="border-y border-border/30 bg-card/20 px-4 py-20 md:pl-28 md:pr-12 md:py-28">
          <div className="mx-auto w-full max-w-[1120px]">
            <Reveal>
              <span className="block font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Send receives a loaded sequence
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="mt-4 font-[var(--font-bebas)] text-5xl leading-tight tracking-tight md:text-6xl">
                By the time it reaches Send,
                <br />
                the work is already done.
              </h2>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-4 max-w-[600px] text-base leading-relaxed text-muted-foreground">
                Other tools make you bring the leads and the copy. Send receives both from the same pipeline
                that identified the buyer.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-12 border border-border bg-card p-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-0">
                  {pipelineStages.map((stage, i) => (
                    <div key={stage.n} className="flex flex-1 items-center gap-0">
                      <div
                        className={`flex-1 border p-5 transition-all ${
                          stage.status === "active"
                            ? "border-send bg-send/10 shadow-[0_0_0_1px_oklch(0.7_0.15_50/0.4),0_0_32px_oklch(0.7_0.15_50/0.12)]"
                            : stage.status === "done"
                              ? "border-border bg-secondary"
                              : "border-border/50 bg-background"
                        }`}
                      >
                        <div
                          className={`font-mono text-[9px] uppercase tracking-[0.14em] ${
                            stage.status === "active" ? "text-send" : "text-muted-foreground/70"
                          }`}
                        >
                          {stage.n}
                        </div>
                        <div
                          className={`mt-1.5 font-[var(--font-bebas)] text-xl tracking-tight ${
                            stage.status === "active" ? "text-send" : "text-foreground"
                          }`}
                        >
                          {stage.label}
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-muted-foreground">{stage.desc}</div>
                      </div>
                      {i < pipelineStages.length - 1 && (
                        <div
                          className={`mx-3 hidden h-px w-6 md:block ${
                            stage.status === "done" ? "bg-send" : "bg-border"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                  <span className="font-mono text-[12px] text-muted-foreground">
                    The sequence already carries
                  </span>
                  {["scored lead", "written copy", "target inbox"].map((item) => (
                    <span
                      key={item}
                      className="border border-send/40 bg-send/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-send"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* PROBLEM STATEMENT */}
        <section className="px-4 py-20 md:pl-28 md:pr-12 md:py-28">
          <div className="mx-auto w-full max-w-[1120px]">
            <Reveal>
              <span className="block font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Why standalone tools break the flow
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="mt-4 font-[var(--font-bebas)] text-5xl leading-tight tracking-tight md:text-6xl">
                Sending is one layer.
                <br />
                The system is the whole workflow.
              </h2>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-4 max-w-[640px] text-base leading-relaxed text-muted-foreground">
                Most standalone sending tools handle delivery well. The problem is everything you bolt onto them
                to get there — and the fact that none of it shares a record.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-5">
                {standaloneToolStack.map((piece, i) => (
                  <div key={piece.layer} className="border border-dashed border-border bg-card p-5 text-center">
                    <div className="text-sm font-semibold text-foreground">{piece.layer}</div>
                    <div className="mt-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground/60">
                      {piece.work}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={320}>
              <p className="mt-6 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Five tools, five logins, zero shared truth.{" "}
                <span className="text-send">Send collapses this to one.</span>
              </p>
            </Reveal>
          </div>
        </section>

        {/* ENGINE CAPABILITIES */}
        <section className="border-y border-border/30 bg-card/20 px-4 py-20 md:pl-28 md:pr-12 md:py-28">
          <div className="mx-auto w-full max-w-[1120px]">
            <Reveal>
              <span className="block font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                What Send does
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="mt-4 font-[var(--font-bebas)] text-5xl leading-tight tracking-tight md:text-6xl">
                The send engine,
                <br />
                with the pipeline already attached.
              </h2>
            </Reveal>
            <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
              {engineCapabilities.map((cap, i) => (
                <Reveal key={cap.n} delay={160 + i * 60}>
                  <div className="group h-full border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-send/40">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-send">{cap.n}</span>
                      <h3 className="font-[var(--font-bebas)] text-2xl tracking-tight">{cap.title}</h3>
                    </div>
                    <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{cap.desc}</p>
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-border/40 pt-3">
                      {cap.tech.map((t) => (
                        <span
                          key={t}
                          className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* COMPARISON */}
        <section className="px-4 py-20 md:pl-28 md:pr-12 md:py-28">
          <div className="mx-auto w-full max-w-[1120px]">
            <Reveal>
              <span className="block font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Send vs standalone
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="mt-4 font-[var(--font-bebas)] text-5xl leading-tight tracking-tight md:text-6xl">
                Same sending.
                <br />
                Everything else already connected.
              </h2>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-4 max-w-[640px] text-base leading-relaxed text-muted-foreground">
                Standalone tools own the send and stop there. Send owns the send and arrives with the rest of
                the funnel built in.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-12 overflow-hidden border border-border">
                {/* Header */}
                <div className="hidden grid-cols-[1.6fr_1fr_1fr] bg-secondary md:grid">
                  <div className="px-6 py-4 font-mono text-xs font-semibold uppercase tracking-wider">
                    Capability
                  </div>
                  <div className="px-6 py-4">
                    <div className="font-mono text-xs font-semibold uppercase tracking-wider text-send">Send</div>
                    <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                      inside the growth engine
                    </div>
                  </div>
                  <div className="px-6 py-4 font-mono text-xs font-semibold uppercase tracking-wider">
                    Instantly / Smartlead
                  </div>
                </div>
                {/* Rows */}
                {comparisonMatrix.map((row, i) => (
                  <div
                    key={row.capability}
                    className="grid grid-cols-1 border-t border-border md:grid-cols-[1.6fr_1fr_1fr]"
                  >
                    <div className="bg-secondary px-6 py-4 text-sm font-medium md:bg-transparent">
                      {row.capability}
                    </div>
                    <div className="flex items-center justify-end gap-2 border-t border-dashed border-border px-6 py-4 text-[13px] md:justify-start md:border-t-0">
                      <span className="font-mono text-[10px] uppercase text-muted-foreground md:hidden">
                        Send
                      </span>
                      <span className={`text-sm ${row.send.has ? "text-send" : "text-muted-foreground/50"}`}>
                        {row.send.has ? "●" : "○"}
                      </span>
                      <span className="text-muted-foreground">{row.send.note}</span>
                    </div>
                    <div className="flex items-center justify-end gap-2 border-t border-dashed border-border px-6 py-4 text-[13px] md:justify-start md:border-t-0">
                      <span className="font-mono text-[10px] uppercase text-muted-foreground md:hidden">
                        Standalone
                      </span>
                      <span
                        className={`text-sm ${row.standalone.has ? "text-send" : "text-muted-foreground/50"}`}
                      >
                        {row.standalone.has ? "●" : "○"}
                      </span>
                      <span className="text-muted-foreground">{row.standalone.note}</span>
                    </div>
                  </div>
                ))}
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
                Stop stitching outbound
                <br />
                <span className="text-send">together by hand.</span>
              </h2>
            </Reveal>
            <Reveal delay={160}>
              <p className="mx-auto mt-6 max-w-xl font-mono text-sm leading-relaxed text-muted-foreground">
                Turn on Send and the pipeline feeds it. Leads, copy, and the meeting on the other end — already
                connected.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mx-auto mt-10 flex max-w-md flex-col gap-4 sm:flex-row">
                <a
                  href="/#audit"
                  className="inline-flex h-12 items-center justify-center bg-accent px-6 font-mono text-sm font-semibold uppercase tracking-widest text-accent-foreground transition-all hover:-translate-y-0.5 hover:bg-accent/90"
                >
                  Start free
                </a>
                <a
                  href="/demo"
                  className="inline-flex h-12 items-center justify-center border border-border px-6 font-mono text-sm uppercase tracking-widest text-foreground transition-all hover:border-send"
                >
                  Talk to us
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        <FooterSection />
      </div>
    </main>
  )
}
