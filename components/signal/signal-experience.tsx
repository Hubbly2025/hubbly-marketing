"use client"

import { useEffect, useRef, useState } from "react"
import { Reveal } from "@/components/autopilot/reveal"

type Metrics = {
  elapsed: string
  depth: number
  score: number
  sections: number
  totalSections: number
  pace: string
  move: string
  back: boolean
}

const TOTAL_SECTIONS = 6

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

export function SignalExperience() {
  // Boot scene staggered reveal
  const [bootStep, setBootStep] = useState(0)
  const [showHeadline, setShowHeadline] = useState(false)

  // Session facts (resolved client-side)
  const [facts, setFacts] = useState({
    device: "detecting",
    viewport: "—",
    referrer: "direct",
    language: "—",
    openedAt: "just now",
  })

  // Live metrics
  const [metrics, setMetrics] = useState<Metrics>({
    elapsed: "0:00",
    depth: 0,
    score: 0,
    sections: 0,
    totalSections: TOTAL_SECTIONS,
    pace: "measuring",
    move: "—",
    back: false,
  })

  const [hudHidden, setHudHidden] = useState(true)

  const bootRef = useRef<HTMLElement | null>(null)
  const sectionRefs = useRef<HTMLElement[]>([])

  // Mutable measurement state held in refs to avoid re-render churn
  const t0Ref = useRef<number>(0)
  const maxDepthRef = useRef(0)
  const movesRef = useRef(0)
  const lastYRef = useRef(0)
  const wentBackRef = useRef(false)
  const seenRef = useRef<Set<Element>>(new Set())

  useEffect(() => {
    t0Ref.current = Date.now()

    const reduceMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

    // Resolve real session facts
    const device = /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop"
    let referrer = "direct"
    try {
      referrer = document.referrer ? new URL(document.referrer).hostname : "direct"
    } catch {
      referrer = "direct"
    }
    setFacts({
      device,
      viewport: `${window.innerWidth}\u00d7${window.innerHeight}`,
      referrer,
      language: (navigator.language || "en").toLowerCase(),
      openedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    })

    // Boot scene stagger
    const timers: number[] = []
    if (reduceMotion) {
      setBootStep(4)
      setShowHeadline(true)
    } else {
      for (let i = 1; i <= 4; i++) {
        timers.push(window.setTimeout(() => setBootStep(i), 500 + i * 620))
      }
      timers.push(window.setTimeout(() => setShowHeadline(true), 500 + 5 * 620))
    }

    // Scroll + pointer measurement
    const onScroll = () => {
      const d = Math.min(
        100,
        Math.round(((window.scrollY + window.innerHeight) / document.body.scrollHeight) * 100),
      )
      if (d > maxDepthRef.current) maxDepthRef.current = d
      if (window.scrollY < lastYRef.current - 300) wentBackRef.current = true
      lastYRef.current = window.scrollY
    }
    const onMove = () => {
      movesRef.current++
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("pointermove", onMove, { passive: true })

    // Section coverage
    const secIO = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) seenRef.current.add(e.target)
        }),
      { threshold: 0.4 },
    )
    sectionRefs.current.forEach((s) => s && secIO.observe(s))

    // HUD visibility tied to boot scene
    let hudIO: IntersectionObserver | null = null
    if (bootRef.current) {
      hudIO = new IntersectionObserver(
        (entries) => setHudHidden(entries[0].isIntersecting),
        { threshold: 0.25 },
      )
      hudIO.observe(bootRef.current)
    }

    const computeScore = () => {
      const t = Math.min(40, (Date.now() - t0Ref.current) / 1000 / 3)
      const d = maxDepthRef.current * 0.35
      const s = (seenRef.current.size / TOTAL_SECTIONS) * 15
      const b = wentBackRef.current ? 10 : 0
      return Math.min(99, Math.round(t + d + s + b))
    }

    const interval = window.setInterval(() => {
      const elapsedMs = Date.now() - t0Ref.current
      const mins = elapsedMs / 60000
      const moves = movesRef.current
      setMetrics({
        elapsed: formatElapsed(elapsedMs),
        depth: maxDepthRef.current,
        score: computeScore(),
        sections: seenRef.current.size,
        totalSections: TOTAL_SECTIONS,
        pace: mins < 0.5 ? "measuring" : maxDepthRef.current / Math.max(mins, 0.01) > 120 ? "skimming" : "reading",
        move: moves > 400 ? "high" : moves > 120 ? "steady" : "light",
        back: wentBackRef.current,
      })
    }, 1000)

    return () => {
      timers.forEach((t) => clearTimeout(t))
      window.clearInterval(interval)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("pointermove", onMove)
      secIO.disconnect()
      hudIO?.disconnect()
    }
  }, [])

  const registerSection = (el: HTMLElement | null) => {
    if (el && !sectionRefs.current.includes(el)) sectionRefs.current.push(el)
  }

  return (
    <div className="bg-background text-foreground">
      {/* NAV */}
      <nav className="fixed inset-x-0 top-0 z-[90] flex items-center justify-between px-6 py-5 mix-blend-difference md:px-8">
        <span className="font-mono text-sm font-bold tracking-[0.04em] text-foreground">HUBBLY SIGNAL</span>
        <a
          href="#close"
          className="rounded-full border border-current px-4 py-2 font-mono text-[11px] tracking-[0.16em] text-foreground transition-opacity hover:opacity-70"
        >
          RUN FREE AUDIT
        </a>
      </nav>

      {/* SESSION HUD */}
      <aside
        aria-label="Your live session, measured by this page"
        className={`fixed bottom-5 right-5 z-[80] w-[248px] overflow-hidden rounded-xl border border-border bg-background/90 font-mono text-[10.5px] shadow-2xl backdrop-blur-md transition-all duration-300 max-[560px]:inset-x-4 max-[560px]:w-auto ${
          hudHidden ? "pointer-events-none translate-y-3 opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-3 text-[9.5px] tracking-[0.16em] text-accent">
          <span className="h-1.5 w-1.5 flex-none animate-[pulse_1.6s_infinite] rounded-full bg-accent" />
          YOUR SESSION · LIVE
        </div>
        <HudRow label="time on page" value={metrics.elapsed} />
        <HudRow label="scroll depth" value={`${metrics.depth}%`} />
        <HudRow label="sections read" value={`${metrics.sections} / ${metrics.totalSections}`} />
        <HudRow label="device" value={facts.device} />
        <div className="flex items-center justify-between border-t border-border px-3 py-2.5">
          <span className="text-[9.5px] tracking-[0.16em] text-muted-foreground/70">ENGAGEMENT</span>
          <span className="text-xl text-accent">{metrics.score}</span>
        </div>
        <div className="h-[3px] bg-border">
          <i
            className="block h-full bg-accent transition-[width] duration-500 ease-out"
            style={{ width: `${metrics.score}%` }}
          />
        </div>
      </aside>

      {/* SCENE 1 · BOOT */}
      <section
        ref={bootRef}
        className="relative flex min-h-screen items-center px-6 py-28 md:px-8"
      >
        <div className="mx-auto w-full max-w-[1060px]">
          <BootLine show={bootStep >= 1}>
            <span className="text-accent">signal</span> · session opened{" "}
            <b className="font-medium text-foreground">{facts.openedAt}</b>
          </BootLine>
          <BootLine show={bootStep >= 2}>
            device <b className="font-medium text-foreground">{facts.device}</b> · viewport{" "}
            <b className="font-medium text-foreground">{facts.viewport}</b>
          </BootLine>
          <BootLine show={bootStep >= 3}>
            arrived from <b className="font-medium text-foreground">{facts.referrer}</b> · language{" "}
            <b className="font-medium text-foreground">{facts.language}</b>
          </BootLine>
          <BootLine show={bootStep >= 4}>
            identity <b className="font-medium text-accent">unresolved</b> — like most of the traffic on your site
          </BootLine>
          <h1
            className={`mt-12 font-[var(--font-bebas)] text-[clamp(44px,8vw,104px)] font-semibold leading-[1.04] tracking-tight transition-all duration-700 ${
              showHeadline ? "translate-y-0 opacity-100" : "translate-y-2.5 opacity-0"
            }`}
          >
            We started reading you
            <br />
            the moment you arrived.
          </h1>
          <p
            className={`mt-6 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground transition-all delay-150 duration-700 md:text-base ${
              showHeadline ? "translate-y-0 opacity-100" : "translate-y-2.5 opacity-0"
            }`}
          >
            Hubbly Signal turns anonymous traffic into buyer intelligence — then connects that intelligence to search
            visibility, outreach, and pipeline actions your team can approve.
          </p>
        </div>
        <div className="absolute bottom-9 left-1/2 -translate-x-1/2 animate-[pulse_2.4s_infinite] font-mono text-[10px] tracking-[0.3em] text-muted-foreground/50">
          SCROLL
        </div>
      </section>

      {/* SCENE 2 · THESIS */}
      <section ref={registerSection} className="flex min-h-screen items-center px-6 py-28 md:px-8">
        <div className="mx-auto w-full max-w-[1060px]">
          <Reveal as="span" className="block font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
            The problem
          </Reveal>
          <Reveal delay={120}>
            <h2 className="mt-6 font-[var(--font-bebas)] text-[clamp(44px,8vw,104px)] font-semibold leading-[1.04] tracking-tight">
              Most website demand
              <br />
              never gets identified.
            </h2>
          </Reveal>
          <Reveal delay={240}>
            <p className="mt-5 font-[var(--font-bebas)] text-[clamp(34px,5.5vw,68px)] font-medium leading-[1.04] tracking-tight text-muted-foreground/50">
              They arrive. Evaluate.
              <br />
              Leave. Invisible.
            </p>
          </Reveal>
        </div>
      </section>

      {/* SCENE 3 · MIRROR */}
      <section ref={registerSection} className="flex min-h-screen items-center px-6 py-28 md:px-8">
        <div className="mx-auto w-full max-w-[1060px]">
          <Reveal as="span" className="block font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
            The demonstration
          </Reveal>
          <Reveal delay={120}>
            <h2 className="mt-6 font-[var(--font-bebas)] text-[clamp(34px,5.5vw,68px)] font-semibold leading-[1.04] tracking-tight">
              What intent looks like in session.
            </h2>
          </Reveal>
          <Reveal delay={240}>
            <p className="mt-5 max-w-[560px] font-mono text-[15px] leading-relaxed text-muted-foreground">
              Everything below was measured live on this page in your browser while you read. On its own, behavior is
              interesting. Resolved identity plus intent is what turns traffic into pipeline.
            </p>
          </Reveal>
          <Reveal delay={360}>
            <div
              className="mt-12 max-w-[520px] rounded-2xl border border-border bg-card p-7 font-mono"
              aria-label="Your measured session"
            >
              <div className="mb-5 flex items-center justify-between text-[10px] tracking-[0.18em] text-accent">
                <span>SESSION · YOU</span>
                <span>VISITOR #UNRESOLVED</span>
              </div>
              <MirrorRow label="time on page" value={metrics.elapsed} />
              <MirrorRow label="deepest scroll" value={`${metrics.depth}%`} />
              <MirrorRow label="reading pace" value={metrics.pace} />
              <MirrorRow label="pointer activity" value={metrics.move} />
              <MirrorRow label="revisited a section" value={metrics.back ? "yes — re-read something" : "no"} />
              <MirrorRow label="engagement score" value={String(metrics.score)} accent />
              <p className="mt-4 text-[10.5px] leading-relaxed text-muted-foreground/60">
                Measured client-side on this page only. Nothing stored, nothing sent. Behavior is a signal. Identity
                makes it actionable.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* SCENE 4 · THE TURN */}
      <section ref={registerSection} className="flex min-h-screen items-center px-6 py-28 md:px-8">
        <div className="mx-auto w-full max-w-[1060px]">
          <Reveal as="span" className="block font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
            The product
          </Reveal>
          <Reveal delay={120}>
            <h2 className="mt-6 font-[var(--font-bebas)] text-[clamp(34px,5.5vw,68px)] font-semibold leading-[1.04] tracking-tight">
              Signal turns anonymous visits
              <br />
              <span className="text-accent">into buyer intelligence.</span>
            </h2>
          </Reveal>
          <Reveal delay={240}>
            <p className="mt-5 max-w-[560px] font-mono text-[15px] leading-relaxed text-muted-foreground">
              A lightweight pixel connects session behavior to company, role, work email, and search-driven intent so
              your team can prioritize real buyers while they are still active.
            </p>
          </Reveal>
          <Reveal delay={360}>
            <div
              className="relative mt-12 max-w-[520px] rounded-2xl border border-accent/35 bg-card p-7"
              aria-label="Sample resolved visitor"
            >
              <span className="absolute -top-2.5 left-6 rounded-md border border-accent/35 bg-background px-2.5 py-1 font-mono text-[9px] tracking-[0.2em] text-accent">
                SAMPLE — WHAT A RESOLVED VISITOR LOOKS LIKE
              </span>
              <div className="flex items-center gap-3.5">
                <span className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[10px] bg-accent/10 font-mono text-[13px] text-accent">
                  AM
                </span>
                <div>
                  <div className="text-[17px] font-semibold">Alex M.</div>
                  <div className="mt-0.5 font-mono text-[11px] text-muted-foreground/60">
                    GROWTH / OPS · BRIGHTON HEALTH
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <div className="font-mono text-[26px] text-accent">94</div>
                  <div className="font-mono text-[9px] tracking-[0.18em] text-muted-foreground/60">INTENT</div>
                </div>
              </div>
              <div className="mt-5 border-t border-border pt-3.5">
                <SampleQuery query="customer retention software" volume="2,400/mo" />
                <SampleQuery query="appointment booking platform" volume="1,900/mo" />
                <SampleQuery query="pricing automation software" volume="1,300/mo" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* SCENE 5 · EXECUTE */}
      <section ref={registerSection} className="flex min-h-screen items-center px-6 py-28 md:px-8">
        <div className="mx-auto w-full max-w-[1060px]">
          <Reveal as="span" className="block font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
            The system
          </Reveal>
          <Reveal delay={120}>
            <h2 className="mt-6 font-[var(--font-bebas)] text-[clamp(34px,5.5vw,68px)] font-semibold leading-[1.04] tracking-tight">
              Then the system moves.
            </h2>
          </Reveal>
          <Reveal delay={240}>
            <p className="mt-5 max-w-[560px] font-mono text-[15px] leading-relaxed text-muted-foreground">
              Signal identifies who is in-market. The rest of Hubbly turns that demand into search visibility, content,
              conversion fixes, outreach, and follow-up — all with approvals built in.
            </p>
          </Reveal>
          <Reveal delay={360}>
            <div className="mt-12 max-w-[640px] font-mono text-[13px]" aria-label="Autopilot job queue">
              <QueueLine
                n="01"
                action="SEARCH VISIBILITY"
                desc="pages built from live buyer demand"
                status="awaiting approval"
              />
              <QueueLine n="02" action="TECHNICAL" desc="structure, links, speed, and site fixes" status="snapshotted" />
              <QueueLine n="03" action="AI SEARCH" desc="schema and answer-ready content" status="queued" />
              <QueueLine n="04" action="CONVERSION" desc="fixes where identified buyers stall" status="queued" />
              <QueueLine
                n="05"
                action="OUTREACH"
                desc="the same accounts worked across the rest of Hubbly"
                status="hubbly os"
              />
            </div>
          </Reveal>
          <Reveal delay={360}>
            <p className="mt-6 flex items-center gap-2.5 font-mono text-[11.5px] text-muted-foreground/60">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M7 1l5 2.4v3.2c0 2.9-2.1 5.3-5 6-2.9-.7-5-3.1-5-6V3.4L7 1z"
                  stroke="oklch(0.7 0.2 45)"
                  strokeWidth="1.2"
                />
              </svg>
              Approval-gated by default. You review. Hubbly ships. Reversible in one click.
            </p>
          </Reveal>
        </div>
      </section>

      {/* SCENE 6 · THE NUMBER */}
      <section ref={registerSection} className="flex min-h-screen items-center px-6 py-28 md:px-8">
        <div className="mx-auto w-full max-w-[1060px]">
          <Reveal as="span" className="block font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
            Simple pricing
          </Reveal>
          <Reveal delay={120}>
            <h2 className="mt-6 font-[var(--font-bebas)] text-[clamp(34px,5.5vw,68px)] font-semibold leading-[1.04] tracking-tight">
              Pay for resolved demand,
              <br />
              not software overhead.
            </h2>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 min-[880px]:grid-cols-4">
              <PriceCol name="FREE" price="$0" unit="/mo" desc="See who is already visiting." />
              <PriceCol name="SIGNAL" price="$98" unit="/mo" desc="Resolve and enrich your highest-intent traffic." />
              <PriceCol name="PRO" price="$298" unit="/mo" desc="Scale resolution, enrichment, and vertical intelligence." />
              <PriceCol
                name="AUTOPILOT"
                price="$498"
                unit="/mo"
                desc="Add the execution engine across search, AI answers, and conversion."
                hot
              />
            </div>
          </Reveal>
          <Reveal delay={360}>
            <p className="mt-5 font-mono text-[11px] text-muted-foreground/60">
              Every paid tier starts with 14 days uncapped. Full outbound agent team →{" "}
              <a href="https://hubbly.io" className="border-b border-border text-muted-foreground hover:text-accent">
                Hubbly OS
              </a>
            </p>
          </Reveal>
        </div>
      </section>

      {/* SCENE 7 · CLOSE */}
      <section ref={registerSection} id="close" className="flex min-h-screen items-center px-6 py-28 text-center md:px-8">
        <div className="mx-auto w-full max-w-[1060px]">
          <Reveal as="span" className="block font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
            Your turn
          </Reveal>
          <Reveal delay={120}>
            <h2 className="mt-6 font-[var(--font-bebas)] text-[clamp(44px,8vw,104px)] font-semibold leading-[1.04] tracking-tight">
              See who your market
              <br />
              <span className="text-accent">already is.</span>
            </h2>
          </Reveal>
          <Reveal delay={240}>
            <p className="mx-auto mt-6 max-w-[560px] font-mono text-[15px] leading-relaxed text-muted-foreground">
              Drop in your URL to see the buyers already visiting your site, the demand you are missing, and the actions
              Hubbly would take next.
            </p>
          </Reveal>
          <Reveal delay={360}>
            <form
              action="/api/audit/form"
              method="post"
              className="mx-auto mt-13 flex max-w-[520px] flex-col gap-2.5 sm:flex-row"
            >
              <input
                name="url"
                type="text"
                inputMode="url"
                required
                placeholder="yourcompany.com"
                aria-label="Your website URL"
                autoComplete="off"
                className="min-h-[56px] flex-1 rounded-xl border border-border bg-card px-5 py-4 font-mono text-base text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="submit"
                className="inline-flex min-h-[56px] items-center justify-center whitespace-nowrap rounded-xl bg-accent px-7 py-4 font-semibold text-accent-foreground transition-all duration-150 hover:-translate-y-px hover:shadow-[0_10px_36px_oklch(0.7_0.2_45_/_0.3)]"
              >
                Run free audit
              </button>
            </form>
          </Reveal>
          <Reveal delay={360}>
            <p className="mt-4 font-mono text-[11px] tracking-[0.06em] text-muted-foreground/60">
              FREE · NO CREDIT CARD
            </p>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="flex flex-wrap justify-between gap-3.5 border-t border-border px-6 py-10 font-mono text-[10.5px] tracking-[0.06em] text-muted-foreground/60 md:px-8">
        <span>© 2026 THE HUBBLY CORPORATION · AUSTIN, TX</span>
        <div className="flex flex-wrap gap-[18px]">
          <a href="/legal/privacy" className="text-muted-foreground hover:text-accent">
            PRIVACY
          </a>
          <a href="/legal/terms" className="text-muted-foreground hover:text-accent">
            TERMS
          </a>
          <a href="/legal/security" className="text-muted-foreground hover:text-accent">
            SECURITY
          </a>
          <a href="https://hubbly.io" className="text-muted-foreground hover:text-accent">
            HUBBLY OS →
          </a>
        </div>
      </footer>
    </div>
  )
}

function HudRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-3 py-1.5 text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

function BootLine({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`font-mono text-[clamp(13px,1.5vw,15px)] leading-[2.3] text-muted-foreground transition-all duration-400 ${
        show ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
      }`}
    >
      {children}
    </div>
  )
}

function MirrorRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between border-t border-border py-2.5 text-[12.5px] text-muted-foreground">
      <span>{label}</span>
      <span className={`text-right ${accent ? "text-accent" : "text-foreground"}`}>{value}</span>
    </div>
  )
}

function SampleQuery({ query, volume }: { query: string; volume: string }) {
  return (
    <div className="flex justify-between py-1.5 font-mono text-[12px] text-muted-foreground">
      <span>{query}</span>
      <span className="text-muted-foreground/60">{volume}</span>
    </div>
  )
}

function QueueLine({ n, action, desc, status }: { n: string; action: string; desc: string; status: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-3.5 border-t border-border py-3.5 text-muted-foreground last:border-b last:border-border">
      <span className="min-w-[28px] text-muted-foreground/60">{n}</span>
      <span className="min-w-[110px] tracking-[0.06em] text-accent md:min-w-[150px]">{action}</span>
      <span>{desc}</span>
      <span className="ml-auto text-[11px] text-[oklch(0.78_0.08_150)]">{status}</span>
    </div>
  )
}

function PriceCol({
  name,
  price,
  unit,
  desc,
  hot,
}: {
  name: string
  price: string
  unit: string
  desc: string
  hot?: boolean
}) {
  return (
    <div
      className={`flex min-h-[240px] flex-col p-7 ${
        hot ? "bg-[linear-gradient(180deg,oklch(0.7_0.2_45_/_0.1),transparent_70%),var(--background)]" : "bg-background"
      }`}
    >
      <span className={`font-mono text-[10px] tracking-[0.2em] ${hot ? "text-accent" : "text-muted-foreground/60"}`}>
        {name}
      </span>
      <div className="mb-1 mt-3.5 text-[clamp(26px,3vw,36px)] font-bold">
        {price}
        <small className="text-[13px] font-normal text-muted-foreground/60">{unit}</small>
      </div>
      <p className="mt-auto text-[13px] leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  )
}
