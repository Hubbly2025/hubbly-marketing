import type { Metadata } from "next"
import { StickyHeader } from "@/components/sticky-header"
import { SideNav } from "@/components/side-nav"
import { FloatingCTA } from "@/components/floating-cta"
import { FooterSection } from "@/components/footer-section"
import { Reveal } from "@/components/autopilot/reveal"
import LazyDemo from "@/components/lazy-demo"
import { pageMetadata, productJsonLd } from "@/lib/seo"

const appJsonLd = productJsonLd({
  name: "Hubbly Send",
  description:
    "Hubbly Send is the outbound email agent inside Hubbly — sequencing, deliverability, and replies, with leads and copy arriving already attached from the pipeline. One of five Hubbly product lines — Signal, Rank, Send, Voice, and Spy — running from one shared buyer context, on autopilot by default with opt-in approval gates.",
  path: "/send",
})

export const metadata: Metadata = pageMetadata({
  title: "Hubbly Send — Cold email, built in",
  description:
    "Send is the outbound email agent inside the growth engine. Leads, copy, and deliverability arrive already attached from the pipeline — no list uploads, no separate tool.",
  path: "/send",
})

const pipeline = [
  { n: "01", name: "Discover", desc: "finds the leads", live: true },
  { n: "02", name: "Score", desc: "ranks by priority", live: true },
  { n: "03", name: "Write", desc: "drafts the copy", live: true },
  { n: "04 · you are here", name: "Send", desc: "sequences + delivers", live: false, active: true },
  { n: "05", name: "Book", desc: "takes the reply", live: false },
]

const stitch = [
  { tool: "Lead source", job: "export & import" },
  { tool: "Your CRM", job: "sync by hand" },
  { tool: "A writer", job: "copy elsewhere" },
  { tool: "Warmup tool", job: "configure & wait" },
  { tool: "A spreadsheet", job: "track replies" },
]

const capabilities = [
  {
    n: "01",
    title: "Sequencing",
    copy: "Multi-step sequences with stop-on-reply and behavior-based branching. Send decides when each step fires and when to pull someone out.",
    tech: "stop_on_reply · branch_on_open · step_delay",
  },
  {
    n: "02",
    title: "Deliverability",
    copy: "Domain warming, inbox rotation, and SPF/DKIM/DMARC handled as infrastructure — not a separate tool you configure and babysit.",
    tech: "warming · rotation · auth · bounce + spam handling",
  },
  {
    n: "03",
    title: "Reply handling",
    copy: "Replies are read for intent. Warm ones are handed to Book to put a meeting on the calendar; the rest stop the sequence cleanly.",
    tech: "intent_detected → handoff: book",
  },
  {
    n: "04",
    title: "Control + provenance",
    copy: "Drafts by default, full send history, provenance on every message. You can see exactly what went out, to whom, and why.",
    tech: "draft_first · audit_trail · per-send provenance",
  },
]

const comparison = [
  { feat: "Finds the leads", send: "Built in · Discover", sendYes: true, std: "Not included", stdYes: false },
  { feat: "Scores & prioritizes", send: "Built in · Score", sendYes: true, std: "Not included", stdYes: false },
  { feat: "Writes the copy", send: "Built in · Write", sendYes: true, std: "You bring it", stdYes: false },
  { feat: "Sequencing", send: "Yes", sendYes: true, std: "Yes", stdYes: true },
  {
    feat: "Deliverability (warming, rotation, auth)",
    send: "Yes",
    sendYes: true,
    std: "Yes",
    stdYes: true,
  },
  { feat: "Books the meeting", send: "Built in · Book", sendYes: true, std: "Not included", stdYes: false },
  { feat: "One system, one record", send: "Yes", sendYes: true, std: "Stitched together", stdYes: false },
]

export default function SendPage() {
  return (
    <main className="relative min-h-screen bg-background grid-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
      <div className="noise-overlay" aria-hidden="true" />
      <StickyHeader />
      <SideNav />
      <FloatingCTA />

      {/* DEMO HERO */}
      <section className="px-4 pt-24 pb-4 md:px-8 md:pt-28">
        <div className="mx-auto w-full max-w-[1400px]">
          <LazyDemo
            src="/demos/hubbly-agent-demos.html?demo=send"
            title="Hubbly Send demo"
            aspect={null}
            className="h-[min(80vh,860px)]"
          />
        </div>
      </section>

      {/* Hero */}
      <header className="relative border-b border-border">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(620px 320px at 18% 0%, oklch(0.7 0.2 45 / 0.10), transparent 70%)",
          }}
        />
        <div className="mx-auto w-full max-w-5xl px-6 pt-28 pb-20 md:pt-32 md:pb-24">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <span className="text-send">Send</span> · the outbound layer
            </p>
          </Reveal>
          <Reveal delay={60}>
            <h1 className="mt-7 font-display text-6xl uppercase leading-[0.92] tracking-tight text-balance md:text-8xl">
              Cold email,
              <br />
              <span className="text-send">built in.</span>
            </h1>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              Most sending tools make you bring the leads and write the copy.{" "}
              <strong className="font-medium text-foreground">Send already has both</strong> — fed
              straight from the pipeline, with deliverability handled.
            </p>
          </Reveal>
          <Reveal delay={180}>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#start"
                className="inline-flex items-center gap-2 bg-accent px-5 py-3 font-mono text-sm font-semibold uppercase tracking-wider text-accent-foreground transition-colors hover:bg-accent/90"
              >
                Start free
              </a>
              <a
                href="#how"
                className="inline-flex items-center gap-2 border border-border px-5 py-3 font-mono text-sm font-semibold uppercase tracking-wider text-foreground transition-colors hover:border-muted-foreground"
              >
                See how it fits
              </a>
              <span className="font-mono text-xs text-muted-foreground">
                no list uploads · no separate tool
              </span>
            </div>
          </Reveal>
        </div>
      </header>

      {/* Pipeline signature */}
      <section id="how" className="border-b border-border">
        <div className="mx-auto w-full max-w-5xl px-6 py-16 md:py-20">
          <Reveal>
            <div className="relative overflow-hidden border border-border bg-card p-8 pt-10 md:p-10">
              <span className="absolute left-5 top-4 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                pipeline · send receives a loaded sequence
              </span>
              <div className="mt-6 flex flex-col items-stretch gap-0 md:flex-row md:items-stretch">
                {pipeline.map((node, i) => (
                  <div key={node.name} className="flex flex-1 flex-col md:flex-row md:items-center">
                    <div
                      className={`flex-1 border p-4 text-center transition-transform hover:-translate-y-0.5 ${
                        node.active
                          ? "border-accent bg-accent/10 shadow-[0_0_0_1px_oklch(0.7_0.2_45/0.35),0_0_38px_oklch(0.7_0.2_45/0.16)] animate-[pulse-glow_3.4s_ease-in-out_infinite]"
                          : "border-border bg-secondary"
                      }`}
                    >
                      <div
                        className={`font-mono text-[10px] uppercase tracking-[0.08em] ${
                          node.active ? "text-accent" : "text-muted-foreground"
                        }`}
                      >
                        {node.n}
                      </div>
                      <div
                        className={`mt-1.5 font-display text-xl uppercase tracking-tight ${
                          node.active ? "text-accent" : "text-foreground"
                        }`}
                      >
                        {node.name}
                      </div>
                      <div className="mt-1 text-xs leading-snug text-muted-foreground">{node.desc}</div>
                    </div>
                    {i < pipeline.length - 1 && (
                      <div
                        className={`mx-auto my-2 h-6 w-0.5 md:mx-2 md:my-0 md:h-0.5 md:w-8 ${
                          node.live ? "bg-accent" : "bg-border"
                        }`}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                <span className="text-sm text-muted-foreground">
                  By the time it reaches Send, the sequence already carries
                </span>
                {["scored lead", "written copy", "target inbox"].map((chip) => (
                  <span
                    key={chip}
                    className="border border-accent/35 bg-accent/10 px-3 py-1 font-mono text-[11px] text-accent"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Problem */}
      <section id="problem" className="border-b border-border">
        <div className="mx-auto w-full max-w-5xl px-6 py-20 md:py-24">
          <Reveal>
            <div className="max-w-2xl">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Why standalone tools break the flow
              </p>
              <h2 className="mt-3.5 font-display text-4xl uppercase leading-tight tracking-tight text-balance md:text-5xl">
                Sending is one layer. The system is the whole workflow.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Most standalone sending tools handle delivery well. The problem is everything you bolt onto
                them to get there — and the fact that none of it shares a record.
              </p>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="mt-11 grid grid-cols-2 gap-3 md:grid-cols-5">
              {stitch.map((piece) => (
                <div key={piece.tool} className="border border-dashed border-border bg-card p-4 text-center">
                  <div className="text-sm font-semibold text-foreground">{piece.tool}</div>
                  <span className="mt-1.5 block font-mono text-[11px] text-muted-foreground">
                    {piece.job}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-5 font-mono text-xs text-muted-foreground">
              five tools, five logins, zero shared truth.{" "}
              <span className="text-accent">Send collapses this to one.</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* Capabilities */}
      <section id="does" className="border-b border-border">
        <div className="mx-auto w-full max-w-5xl px-6 py-20 md:py-24">
          <Reveal>
            <div className="max-w-2xl">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                What Send does
              </p>
              <h2 className="mt-3.5 font-display text-4xl uppercase leading-tight tracking-tight text-balance md:text-5xl">
                The send engine, with the pipeline already attached.
              </h2>
            </div>
          </Reveal>
          <div className="mt-11 grid grid-cols-1 gap-4 md:grid-cols-2">
            {capabilities.map((cap, i) => (
              <Reveal key={cap.title} delay={i * 60}>
                <div className="h-full border border-border bg-card p-6 transition-transform hover:-translate-y-0.5 hover:border-muted-foreground">
                  <div className="font-mono text-xs text-accent">{cap.n}</div>
                  <h3 className="mt-3 font-display text-2xl uppercase tracking-tight">{cap.title}</h3>
                  <p className="mt-2.5 leading-relaxed text-muted-foreground">{cap.copy}</p>
                  <div className="mt-3.5 border-t border-border pt-3 font-mono text-[11px] text-muted-foreground">
                    {cap.tech}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section id="compare" className="border-b border-border">
        <div className="mx-auto w-full max-w-5xl px-6 py-20 md:py-24">
          <Reveal>
            <div className="max-w-2xl">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Send vs standalone
              </p>
              <h2 className="mt-3.5 font-display text-4xl uppercase leading-tight tracking-tight text-balance md:text-5xl">
                Same sending. Everything else already connected.
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Standalone tools own the send and stop there. Send owns the send and arrives with the
                rest of the funnel built in.
              </p>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="mt-11 overflow-hidden border border-border">
              {/* Header row */}
              <div className="hidden grid-cols-[1.4fr_1fr_1fr] items-center bg-secondary md:grid">
                <div className="px-6 py-4 text-sm font-semibold">Capability</div>
                <div className="px-6 py-4 text-sm font-semibold text-accent">
                  Send
                  <span className="mt-0.5 block font-mono text-[10px] font-normal text-muted-foreground">
                    inside the growth engine
                  </span>
                </div>
                <div className="px-6 py-4 text-sm font-semibold">Instantly / Smartlead</div>
              </div>
              {comparison.map((row) => (
                <div
                  key={row.feat}
                  className="grid grid-cols-1 items-center border-t border-border md:grid-cols-[1.4fr_1fr_1fr]"
                >
                  <div className="bg-secondary px-6 py-4 text-sm font-semibold text-foreground md:bg-transparent md:font-medium">
                    {row.feat}
                  </div>
                  <div className="flex items-center justify-end gap-2 border-t border-dashed border-border px-6 py-4 text-[13px] text-muted-foreground md:justify-start md:border-t-0">
                    <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground md:hidden">
                      Send
                    </span>
                    <span className={`text-xs ${row.sendYes ? "text-accent" : "text-muted-foreground"}`}>
                      {row.sendYes ? "●" : "○"}
                    </span>
                    {row.send}
                  </div>
                  <div className="flex items-center justify-end gap-2 border-t border-dashed border-border px-6 py-4 text-[13px] text-muted-foreground md:justify-start md:border-t-0">
                    <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground md:hidden">
                      Standalone
                    </span>
                    <span className={`text-xs ${row.stdYes ? "text-accent" : "text-muted-foreground"}`}>
                      {row.stdYes ? "●" : "○"}
                    </span>
                    {row.std}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Closing CTA */}
      <section id="start" className="border-b border-border">
        <div className="mx-auto w-full max-w-5xl px-6 py-20 md:py-24">
          <Reveal>
            <div
              className="border border-border bg-card px-8 py-16 text-center md:px-12"
              style={{
                backgroundImage:
                  "radial-gradient(420px 200px at 80% 20%, oklch(0.7 0.2 45 / 0.12), transparent 70%)",
              }}
            >
              <h2 className="mx-auto max-w-xl font-display text-4xl uppercase leading-[1.05] tracking-tight text-balance md:text-5xl">
                Stop stitching outbound together by hand.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
                Turn on Send and the pipeline feeds it. Leads, copy, and the meeting on the other end —
                already connected.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <a
                  href="/#audit"
                  className="inline-flex items-center gap-2 bg-accent px-5 py-3 font-mono text-sm font-semibold uppercase tracking-wider text-accent-foreground transition-colors hover:bg-accent/90"
                >
                  Start free
                </a>
                <a
                  href="/demo"
                  className="inline-flex items-center gap-2 border border-border px-5 py-3 font-mono text-sm font-semibold uppercase tracking-wider text-foreground transition-colors hover:border-muted-foreground"
                >
                  Talk to us
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <FooterSection />
    </main>
  )
}
