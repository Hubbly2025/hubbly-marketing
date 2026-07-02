import type { Metadata } from "next"
import { StickyHeader } from "@/components/sticky-header"
import { SideNav } from "@/components/side-nav"
import { FloatingCTA } from "@/components/floating-cta"
import { FooterSection } from "@/components/footer-section"
import { AutopilotEngine } from "@/components/autopilot/autopilot-engine"
import { Reveal } from "@/components/autopilot/reveal"

export const metadata: Metadata = {
  title: "Hubbly Rank — SEO + AEO on autopilot",
  description:
    "Hubbly Rank publishes verified content for Google and AI engines — ChatGPT, Perplexity, Bing — with snapshot, verify, and rollback rails always on. $498/mo in the Autopilot tier.",
  alternates: { canonical: "https://hubbly.io/autopilot" },
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What does Hubbly Rank do?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Rank turns what your buyers search into pages you own — content, technical SEO fixes, schema, and AI-answer placement. It runs on full autopilot with rails always on: snapshot before every change, verify after every publish, and auto-rollback on regression.",
      },
    },
    {
      "@type": "Question",
      name: "What happens if a change hurts my rankings?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Rank keeps rails on at all times — every change is snapshotted before it ships and verified after it publishes, and anything that regresses is rolled back automatically. Nothing is a one-way door.",
      },
    },
  ],
}

const readers = [
  {
    title: "The crawler",
    copy: "Clean structure, fast load, internal links, canonical clarity, and the keyword targets your buyers actually ran — the inputs that move you up the rankings.",
    chips: ["META", "CANONICAL", "INTERNAL LINKS", "SITEMAP", "SPEED"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.4" />
        <path d="M11 3v16M3 11h16" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    title: "The model",
    copy: "Structured data, entity clarity, and citation-ready answers under the questions buyers ask — the inputs AI engines use to decide who gets named in the answer.",
    chips: ["JSON-LD", "ENTITIES", "ANSWER BLOCKS", "SCHEMA", "llms.txt"],
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.4" />
        <path d="M7 8h8M7 11h8M7 14h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
]

const capabilities = [
  { n: "01", title: "Strategy", copy: "A living plan rebuilt from live rankings, buyer demand, and market changes — not a static audit PDF." },
  { n: "02", title: "Content", copy: "New pages and refreshes drafted from what buyers actually search, published with snapshots and reversible in one click." },
  { n: "03", title: "Technical", copy: "Canonicals, internal links, speed, schema, and structural fixes — applied with snapshots, reversible in one click." },
  { n: "04", title: "Visibility", copy: "Optimizations for both Google rankings and AI answer engines, shipped in the same pass." },
  { n: "05", title: "Pipeline", copy: "Every change traced back to the buyers it reached — pipeline relevance first, traffic second." },
]

const phases = [
  { n: "STAGE 01", title: "Foundation", copy: "Technical health, indexed pages, schema, and AI-answer structure. The groundwork the engine builds on.", days: "DAYS 0–90" },
  { n: "STAGE 02", title: "Traction", copy: "Content shipping weekly against live demand. Rankings and citations start moving on the terms your buyers run.", days: "MONTHS 3–6" },
  { n: "STAGE 03", title: "Momentum", copy: "Authority compounds. The pages you own start feeding pipeline, not just traffic.", days: "MONTHS 6–9" },
  { n: "STAGE 04", title: "Compounding", copy: "A library of owned pages working for you around the clock — search and AI both. The engine never stops.", days: "MONTHS 9–12" },
]

export default function AutopilotPage() {
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
                Hubbly Rank · SEO + AEO on autopilot
              </Reveal>
              <Reveal delay={120}>
                <h1 className="mt-6 font-[var(--font-bebas)] text-5xl leading-[0.95] tracking-tight sm:text-7xl lg:text-[92px]">
                  Hubbly Rank.
                  <br />
                  Your SEO team,
                  <br />
                  <span className="text-accent">running itself.</span>
                </h1>
              </Reveal>
              <Reveal delay={240}>
                <p className="mt-6 max-w-[600px] font-mono text-sm leading-relaxed text-muted-foreground md:text-base">
                  Rank helps you show up on Google and in AI answers — through content, technical fixes, schema, and
                  entity clarity — with rails always on: snapshot before every change, verify after every publish,
                  auto-rollback on regression.
                </p>
              </Reveal>
              <Reveal delay={240}>
                <AutopilotEngine />
              </Reveal>
            </div>
          </header>

          {/* SCOREBOARDS */}
          <div className="border-y border-border/60 bg-card py-[18px]" aria-label="Built for both scoreboards">
            <div className="mx-auto w-full max-w-[1060px] px-4 md:px-8">
              <p className="mb-3 text-center font-mono text-[9px] tracking-[0.3em] text-muted-foreground/60">
BUILT FOR RANKINGS AND ANSWERS
              </p>
              <div className="flex flex-wrap items-center justify-between gap-[18px]">
                <div className="flex items-center gap-3 whitespace-nowrap font-mono text-[11.5px] tracking-[0.1em]">
                  <span className="flex gap-1">
                    {["#1", "#2", "#3"].map((p) => (
                      <span key={p} className="rounded-sm border border-border px-[6px] py-[2px] text-[9px] text-muted-foreground/60">
                        {p}
                      </span>
                    ))}
                  </span>
                  <span>Search rankings</span>
                </div>
                <div className="order-3 flex min-w-[200px] flex-1 items-center gap-[14px] md:order-none">
                  <span className="h-px flex-1 bg-border" />
                  <span className="whitespace-nowrap font-mono text-[10px] tracking-[0.16em] text-accent">
                    One engine. Both result pages.
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <div className="flex items-center gap-3 whitespace-nowrap font-mono text-[11.5px] tracking-[0.1em]">
                  <span>AI answers</span>
                  <span className="text-[10.5px] text-muted-foreground/60">ChatGPT · Perplexity · Grok · Gemini</span>
                </div>
              </div>
            </div>
          </div>

          {/* DUAL READER */}
          <section className="px-4 py-24 md:py-32 md:pl-28 md:pr-12">
            <div className="mx-auto w-full max-w-[1060px]">
              <Reveal as="span" className="block font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
                Search changed. The job didn&apos;t.
              </Reveal>
              <Reveal delay={120}>
                <h2 className="mt-4 font-[var(--font-bebas)] text-4xl leading-[1.05] tracking-tight md:text-6xl">
                  Google is no longer
                  <br />
                  the only scoreboard.
                </h2>
              </Reveal>
              <Reveal delay={240}>
                <p className="mt-4 max-w-[600px] font-mono text-sm leading-relaxed text-muted-foreground md:text-base">
                  Buyers ask AI engines now. Every page the engine ships is structured for two readers — the crawler that
                  ranks you and the model that cites you. Same pass, same page.
                </p>
              </Reveal>
              <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
                {readers.map((r, i) => (
                  <Reveal key={r.title} delay={240 + i * 120}>
                    <div className="h-full border border-border bg-card p-7">
                      <div className="mb-3 flex items-center gap-[10px] text-accent">
                        {r.icon}
                        <h3 className="font-[var(--font-bebas)] text-xl tracking-tight text-foreground">{r.title}</h3>
                      </div>
                      <p className="font-mono text-[13.5px] leading-relaxed text-muted-foreground">{r.copy}</p>
                      <div className="mt-4 flex flex-wrap gap-[7px]">
                        {r.chips.map((chip) => (
                          <span
                            key={chip}
                            className="border border-border px-[9px] py-[5px] font-mono text-[10px] tracking-[0.06em] text-muted-foreground"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* CAPABILITY GRID */}
          <section className="border-y border-border/30 bg-card/40 px-4 py-24 md:py-32 md:pl-28 md:pr-12">
            <div className="mx-auto w-full max-w-[1060px]">
              <Reveal as="span" className="block font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
                What the engine runs
              </Reveal>
              <Reveal delay={120}>
                <h2 className="mt-4 font-[var(--font-bebas)] text-4xl leading-[1.05] tracking-tight md:text-6xl">
                  Everything an SEO operator does.
                  <br />
                  Every week. Forever.
                </h2>
              </Reveal>
              <Reveal delay={240}>
                <p className="mt-4 max-w-[600px] font-mono text-sm leading-relaxed text-muted-foreground md:text-base">
                  Every task scored against the real buyers Signal identifies on your site — pipeline relevance first,
                  traffic second.
                </p>
              </Reveal>
              <div className="mt-12 grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
                {capabilities.map((cap, i) => (
                  <Reveal key={cap.n} delay={120 + (i % 3) * 80}>
                    <div className="group h-full border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40">
                      <span className="font-mono text-[10px] tracking-[0.18em] text-accent">{cap.n}</span>
                      <h3 className="mb-[7px] mt-[11px] font-[var(--font-bebas)] text-lg tracking-tight">{cap.title}</h3>
                      <p className="font-mono text-[13px] leading-relaxed text-muted-foreground">{cap.copy}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* CONTROL */}
          <section className="px-4 py-24 md:py-32 md:pl-28 md:pr-12">
            <div className="mx-auto w-full max-w-[1060px]">
              <Reveal as="span" className="block font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
                Control
              </Reveal>
              <Reveal delay={120}>
                <h2 className="mt-4 font-[var(--font-bebas)] text-4xl leading-[1.05] tracking-tight md:text-6xl">
                  It does the work.
                  <br />
                  <span className="text-accent">You make the calls.</span>
                </h2>
              </Reveal>
              <Reveal delay={240}>
                <p className="mt-4 max-w-[600px] font-mono text-sm leading-relaxed text-muted-foreground md:text-base">
                  Autonomy without discipline is a liability. Rank runs on full autopilot, snapshots before every
                  change, verifies after every publish, and can undo anything it ships.
                </p>
              </Reveal>
              <Reveal delay={240}>
                <div className="mt-12 flex flex-wrap items-center gap-4 border border-accent/40 bg-accent/10 p-7">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-none text-accent" aria-hidden="true">
                    <path d="M10 1l7 3.4v4.5c0 4-2.9 7.3-7 8.1-4.1-.8-7-4.1-7-8.1V4.4L10 1z" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M6.5 10l2.3 2.3L14 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  <div className="flex-1">
                    <b className="font-mono text-sm font-semibold tracking-wide text-foreground">
                      Full autopilot with rails always on: snapshot before every change, verify after every publish,
                      auto-rollback on regression. Prefer to review first? Approval gates are one toggle.
                    </b>
                    <p className="mt-1 max-w-[560px] font-mono text-[13.5px] leading-relaxed text-muted-foreground">
                      The system keeps a full history it can always reverse, and you can put an approval gate in front of
                      any change whenever you want one. This isn&apos;t a 90-day project — it&apos;s a permanent member of
                      your team.
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </section>

          {/* RETENTION TIMELINE */}
          <section className="border-y border-border/30 bg-card/40 px-4 py-24 md:py-32 md:pl-28 md:pr-12">
            <div className="mx-auto w-full max-w-[1060px]">
              <Reveal as="span" className="block font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
                How SEO compounds
              </Reveal>
              <Reveal delay={120}>
                <h2 className="mt-4 font-[var(--font-bebas)] text-4xl leading-[1.05] tracking-tight md:text-6xl">
                  Foundation first.
                  <br />
                  Then it compounds.
                </h2>
              </Reveal>
              <div className="mt-12 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
                {phases.map((phase, i) => (
                  <Reveal key={phase.n} delay={120 + i * 80} className="bg-card p-6">
                    <span className="font-mono text-[10px] tracking-[0.16em] text-accent">{phase.n}</span>
                    <h3 className="mb-[7px] mt-[10px] font-[var(--font-bebas)] text-lg tracking-tight">{phase.title}</h3>
                    <p className="font-mono text-[12.5px] leading-relaxed text-muted-foreground">{phase.copy}</p>
                    <div className="mt-[10px] font-mono text-[10px] tracking-[0.06em] text-muted-foreground/60">
                      {phase.days}
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          {/* WHERE IT FITS */}
          <section className="px-4 py-24 md:py-32 md:pl-28 md:pr-12">
            <div className="mx-auto w-full max-w-[1060px]">
              <Reveal as="span" className="block font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
                Where SEO fits in the system
              </Reveal>
              <Reveal delay={120}>
                <h2 className="mt-4 font-[var(--font-bebas)] text-4xl leading-[1.05] tracking-tight md:text-6xl">
                  Search captures the demand.
                  <br />
                  The rest of Hubbly acts on it.
                </h2>
              </Reveal>
              <Reveal delay={240}>
                <p className="mt-4 max-w-[640px] font-mono text-sm leading-relaxed text-muted-foreground md:text-base">
                  Search captures the demand. The rest of the growth engine acts on it — Signal finds the buyers, Voice
                  and Send reach them, and every result feeds back into one shared system.
                </p>
              </Reveal>
              <Reveal delay={240}>
                <div className="mt-7 flex flex-wrap gap-7 font-mono text-xs tracking-[0.1em]">
                  <a href="/platform" className="border-b border-accent/40 pb-[2px] text-accent transition-colors hover:text-accent/80">
                    SEE THE PLATFORM →
                  </a>
                  <a href="/" className="border-b border-accent/40 pb-[2px] text-accent transition-colors hover:text-accent/80">
                    SEE THE FULL GROWTH ENGINE →
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
                  See your SEO +
                  <br />
                  <span className="text-accent">AI Search queue.</span>
                </h2>
              </Reveal>
              <Reveal delay={240}>
                <p className="mx-auto mt-5 max-w-xl font-mono text-xs leading-relaxed text-muted-foreground md:text-sm">
                  Drop your URL. Get the rankings you&apos;re losing, the AI answers you&apos;re missing, and the exact
                  queue Hubbly would run for you — free, in about 2 minutes.
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
                    className="inline-flex min-h-[52px] items-center justify-center whitespace-nowrap bg-accent px-7 py-4 font-mono text-xs uppercase tracking-widest text-background transition-all duration-200 hover:bg-accent/90 active:scale-[0.98]"
                  >
                    Run free audit
                  </button>
                </form>
              </Reveal>
              <Reveal delay={360}>
                <p className="mt-4 font-mono text-[10.5px] tracking-[0.06em] text-muted-foreground/60">
                  FREE · NO CREDIT CARD · RAILS ALWAYS ON — SNAPSHOT · VERIFY · ROLLBACK
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
