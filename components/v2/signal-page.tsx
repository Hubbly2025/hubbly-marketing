"use client"

import { useEffect, useRef, useState } from "react"
import styles from "@/app/signal/signal.module.css"

const BOOT_LINES = 4

function fmt(ms: number) {
  const s = Math.floor(ms / 1000)
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0")
}

export default function SignalPage() {
  const t0Ref = useRef<number>(Date.now())
  const rootRef = useRef<HTMLDivElement>(null)
  const bootRef = useRef<HTMLElement>(null)

  // Boot scene reveal state
  const [bootShown, setBootShown] = useState<number>(0)
  const [headlineShown, setHeadlineShown] = useState(false)

  // Static session facts
  const [facts, setFacts] = useState({
    device: "detecting",
    viewport: "—",
    referrer: "direct",
    lang: "—",
    time: "just now",
  })

  // HUD visibility
  const [hudHidden, setHudHidden] = useState(true)

  // Live measurements
  const [live, setLive] = useState({
    elapsed: "0:00",
    depth: 0,
    sections: 0,
    score: 0,
    pace: "measuring",
    move: "—",
    back: "no",
  })

  const totalSecsRef = useRef(0)

  // Live chronological session log ("we've been watching since you got here")
  const [logEvents, setLogEvents] = useState<{ time: string; text: string }[]>([])

  // Capture session facts on mount
  useEffect(() => {
    t0Ref.current = Date.now()
    const dev = /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop"
    let ref = "direct"
    try {
      ref = document.referrer ? new URL(document.referrer).hostname : "direct"
    } catch {
      ref = "direct"
    }
    setFacts({
      device: dev,
      viewport: window.innerWidth + "\u00d7" + window.innerHeight,
      referrer: ref,
      lang: (navigator.language || "en").toLowerCase(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    })
  }, [])

  // Boot sequence timing
  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = []
    for (let i = 0; i < BOOT_LINES; i++) {
      timeouts.push(setTimeout(() => setBootShown((n) => Math.max(n, i + 1)), 500 + i * 620))
    }
    timeouts.push(setTimeout(() => setHeadlineShown(true), 500 + BOOT_LINES * 620))
    return () => timeouts.forEach(clearTimeout)
  }, [])

  // Live measurement loop + listeners
  useEffect(() => {
    let maxDepth = 0
    let moves = 0
    let lastY = 0
    let wentBack = false
    const secsSeen = new Set<Element>()
    const secs = rootRef.current ? Array.from(rootRef.current.querySelectorAll("[data-sec]")) : []
    totalSecsRef.current = secs.length

    // Chronological session log — deduped by key, built from real behavior
    const logKeys = new Set<string>()
    const logArr: { time: string; text: string }[] = []
    const pushLog = (key: string, text: string) => {
      if (logKeys.has(key)) return
      logKeys.add(key)
      logArr.push({ time: fmt(Date.now() - t0Ref.current), text })
      setLogEvents([...logArr])
    }

    // Opening entries from the real session
    const dev = /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop"
    let ref = "direct"
    try {
      ref = document.referrer ? new URL(document.referrer).hostname : "direct"
    } catch {
      ref = "direct"
    }
    pushLog("arrive", `arrived from ${ref}`)
    pushLog("device", `identified ${dev} · ${window.innerWidth}\u00d7${window.innerHeight}`)

    const onScroll = () => {
      const d = Math.min(
        100,
        Math.round(((window.scrollY + window.innerHeight) / document.body.scrollHeight) * 100),
      )
      if (d > maxDepth) {
        maxDepth = d
        if (d >= 25) pushLog("d25", "scrolled past 25% — engaged")
        if (d >= 50) pushLog("d50", "reached the halfway mark")
        if (d >= 75) pushLog("d75", "read 75% of the page")
        if (d >= 95) pushLog("d95", "read to the very end")
      }
      if (window.scrollY < lastY - 300) {
        wentBack = true
        pushLog("back", "scrolled back up — re-reading")
      }
      lastY = window.scrollY
    }
    const onMove = () => {
      moves++
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("pointermove", onMove, { passive: true })

    const secIO = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            secsSeen.add(e.target)
            const label = e.target.getAttribute("data-label")
            if (label) pushLog(`sec-${label}`, `read "${label}"`)
          }
        }),
      { threshold: 0.4 },
    )
    secs.forEach((s) => secIO.observe(s))

    const score = () => {
      const t = Math.min(40, (Date.now() - t0Ref.current) / 1000 / 3)
      const d = maxDepth * 0.35
      const s = secs.length ? (secsSeen.size / secs.length) * 15 : 0
      const b = wentBack ? 10 : 0
      return Math.min(99, Math.round(t + d + s + b))
    }

    const interval = setInterval(() => {
      const sc = score()
      const mins = (Date.now() - t0Ref.current) / 60000
      const secsElapsed = (Date.now() - t0Ref.current) / 1000
      if (secsElapsed >= 30) pushLog("t30", "30 seconds in — still here")
      if (secsElapsed >= 60) pushLog("t60", "over a minute — high intent")
      if (sc >= 60) pushLog("hot", "engagement crossed 60 — qualified")
      setLive({
        elapsed: fmt(Date.now() - t0Ref.current),
        depth: maxDepth,
        sections: secsSeen.size,
        score: sc,
        move: moves > 400 ? "high" : moves > 120 ? "steady" : "light",
        back: wentBack ? "yes \u2014 re-read something" : "no",
        pace: mins < 0.5 ? "measuring" : maxDepth / Math.max(mins, 0.01) > 120 ? "skimming" : "reading",
      })
    }, 1000)

    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("pointermove", onMove)
      secIO.disconnect()
      clearInterval(interval)
    }
  }, [])

  // HUD appears after boot scene leaves view
  useEffect(() => {
    const node = bootRef.current
    if (!node) return
    const io = new IntersectionObserver(
      (es) => setHudHidden(es[0].isIntersecting),
      { threshold: 0.25 },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])

  // Scene reveals
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add(styles.in)
            io.unobserve(e.target)
          }
        }),
      { threshold: 0.18 },
    )
    if (rootRef.current) {
      rootRef.current.querySelectorAll(`.${styles.rv}`).forEach((el) => io.observe(el))
    }
    return () => io.disconnect()
  }, [])

  const totalSecs = totalSecsRef.current || 6

  return (
    <div className={styles.page} ref={rootRef}>
      <nav className={styles.nav}>
        <span className={styles.logo}>HUBBLY SIGNAL</span>
        <a className={styles.cta} href="#close">
          RUN FREE AUDIT
        </a>
      </nav>

      {/* HUD: the visitor's own live session */}
      <aside
        className={`${styles.hud} ${hudHidden ? styles.hide : ""}`}
        aria-label="Your live session, measured by this page"
      >
        <div className={styles.hTop}>
          <span className={styles.pulse} />
          YOUR SESSION · LIVE
        </div>
        <div className={styles.hRow}>
          <span>time on page</span>
          <span>{live.elapsed}</span>
        </div>
        <div className={styles.hRow}>
          <span>scroll depth</span>
          <span>{live.depth}%</span>
        </div>
        <div className={styles.hRow}>
          <span>sections read</span>
          <span>
            {live.sections} / {totalSecs}
          </span>
        </div>
        <div className={styles.hRow}>
          <span>device</span>
          <span>{facts.device}</span>
        </div>
        <div className={styles.hScore}>
          <span style={{ color: "var(--dim)", letterSpacing: "0.16em", fontSize: "9.5px" }}>ENGAGEMENT</span>
          <span className={styles.v}>{live.score}</span>
        </div>
        <div className={styles.hBar}>
          <i style={{ width: `${live.score}%` }} />
        </div>
      </aside>

      {/* SCENE 1 · BOOT */}
      <section className={`${styles.scene} ${styles.boot}`} ref={bootRef}>
        <div className={styles.wrap}>
          <div className={`${styles.line} ${bootShown >= 1 ? styles.show : ""}`}>
            <span className={styles.or}>signal</span> · session opened <b>{facts.time}</b>
          </div>
          <div className={`${styles.line} ${bootShown >= 2 ? styles.show : ""}`}>
            device <b>{facts.device}</b> · viewport <b>{facts.viewport}</b>
          </div>
          <div className={`${styles.line} ${bootShown >= 3 ? styles.show : ""}`}>
            arrived from <b>{facts.referrer}</b> · language <b>{facts.lang}</b>
          </div>
          <div className={`${styles.line} ${bootShown >= 4 ? styles.show : ""}`}>
            identity <b className={styles.or}>unresolved</b> — like 97% of the traffic on your site
          </div>
          <h1 className={`${styles.huge} ${headlineShown ? styles.show : ""}`}>
            We started reading you
            <br />
            the moment you arrived.
          </h1>
        </div>
        <div className={styles.scrollCue}>SCROLL</div>
      </section>

      {/* SCENE 2 · THESIS */}
      <section className={styles.scene} data-sec data-label="The problem">
        <div className={styles.wrap}>
          <span className={`${styles.k} ${styles.rv}`}>The problem</span>
          <h2 className={`${styles.huge} ${styles.rv} ${styles.d1}`} style={{ marginTop: 24 }}>
            97% of your traffic
            <br />
            does exactly this.
          </h2>
          <p
            className={`${styles.big} ${styles.dim} ${styles.rv} ${styles.d2}`}
            style={{ marginTop: 20, fontWeight: 500 }}
          >
            Reads. Decides. Leaves.
            <br />
            Nameless.
          </p>
        </div>
      </section>

      {/* SCENE 3 · MIRROR */}
      <section className={styles.scene} data-sec data-label="The demonstration">
        <div className={styles.wrap}>
          <span className={`${styles.k} ${styles.rv}`}>The demonstration</span>
          <h2 className={`${styles.big} ${styles.rv} ${styles.d1}`} style={{ marginTop: 24 }}>
            We just watched you do it.
          </h2>
          <p className={`${styles.sub} ${styles.rv} ${styles.d2}`} style={{ marginTop: 18 }}>
            Everything below was measured on this page, in your browser, while you read. No server, no cookies —
            just behavior. Now imagine it with a name attached.
          </p>
          <div className={`${styles.mirror} ${styles.rv} ${styles.d3}`} aria-label="Your measured session">
            <div className={styles.mHead}>
              <span>SESSION · YOU</span>
              <span>VISITOR #UNRESOLVED</span>
            </div>
            <div className={styles.mRow}>
              <span>time on page</span>
              <span>{live.elapsed}</span>
            </div>
            <div className={styles.mRow}>
              <span>deepest scroll</span>
              <span>{live.depth}%</span>
            </div>
            <div className={styles.mRow}>
              <span>reading pace</span>
              <span>{live.pace}</span>
            </div>
            <div className={styles.mRow}>
              <span>pointer activity</span>
              <span>{live.move}</span>
            </div>
            <div className={styles.mRow}>
              <span>revisited a section</span>
              <span>{live.back}</span>
            </div>
            <div className={styles.mRow}>
              <span>engagement score</span>
              <span style={{ color: "var(--accent)" }}>{live.score}</span>
            </div>
            <div className={styles.mFoot}>
              Measured client-side on this page only. Nothing stored, nothing sent. People lie. The data doesn&apos;t.
            </div>
          </div>
        </div>
      </section>

      {/* SCENE 3.5 · THE RECORD (live session log) */}
      <section className={styles.scene} data-sec data-label="The record">
        <div className={styles.wrap}>
          <span className={`${styles.k} ${styles.rv}`}>The record</span>
          <h2 className={`${styles.big} ${styles.rv} ${styles.d1}`} style={{ marginTop: 24 }}>
            We&apos;ve been watching
            <br />
            <span className={styles.or}>since you got here.</span>
          </h2>
          <p className={`${styles.sub} ${styles.rv} ${styles.d2}`} style={{ marginTop: 18 }}>
            Not a mockup. This is your actual session, logged in order as it happened. Every line below was written
            by something you did on this page.
          </p>
          <div className={`${styles.record} ${styles.rv} ${styles.d3}`} aria-label="Your live session log">
            <div className={styles.recHead}>
              <span>
                <span className={styles.pulse} style={{ display: "inline-block", marginRight: 7 }} />
                SESSION LOG · LIVE
              </span>
              <span>{logEvents.length} EVENTS</span>
            </div>
            <div className={styles.logFeed} aria-live="polite">
              {logEvents.length === 0 ? (
                <div className={styles.logRow}>
                  <span className={styles.logTime}>0:00</span>
                  <span className={styles.logText}>session opened — listening…</span>
                </div>
              ) : (
                logEvents.map((e, i) => (
                  <div
                    key={`${e.time}-${e.text}`}
                    className={`${styles.logRow} ${i === logEvents.length - 1 ? styles.fresh : ""}`}
                  >
                    <span className={styles.logTime}>{e.time}</span>
                    <span className={styles.logText}>{e.text}</span>
                  </div>
                ))
              )}
            </div>
            <div className={styles.recFoot}>
              Anonymous, client-side, nothing stored. Signal does exactly this to every real visitor — then attaches
              a name, a company, and the searches that brought them in.
            </div>
          </div>
        </div>
      </section>

      {/* SCENE 4 · THE TURN */}
      <section className={styles.scene} data-sec data-label="The product">
        <div className={styles.wrap}>
          <span className={`${styles.k} ${styles.rv}`}>The product</span>
          <h2 className={`${styles.big} ${styles.rv} ${styles.d1}`} style={{ marginTop: 24 }}>
            Signal does this to your traffic.
            <br />
            <span className={styles.or}>With names.</span>
          </h2>
          <p className={`${styles.sub} ${styles.rv} ${styles.d2}`} style={{ marginTop: 18 }}>
            A lightweight pixel resolves anonymous sessions against an identity graph — person, company, title, work
            email — and scores intent from behavior and the searches that brought them in.
          </p>
          <div className={`${styles.sample} ${styles.rv} ${styles.d3}`} aria-label="Sample resolved visitor">
            <span className={styles.tag}>SAMPLE — WHAT A RESOLVED VISITOR LOOKS LIKE</span>
            <div className={styles.sTop}>
              <span className={styles.avatar}>AM</span>
              <div>
                <div className={styles.sName}>Alex M.</div>
                <div className={styles.sRole}>GROWTH / OPS · BRIGHTON HEALTH</div>
              </div>
              <div className={styles.sScore}>
                <div className={styles.v}>94</div>
                <div className={styles.l}>INTENT</div>
              </div>
            </div>
            <div className={styles.sQ}>
              <div className={styles.q}>
                <span>customer retention software</span>
                <span>2,400/mo</span>
              </div>
              <div className={styles.q}>
                <span>appointment booking platform</span>
                <span>1,900/mo</span>
              </div>
              <div className={styles.q}>
                <span>pricing automation software</span>
                <span>1,300/mo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SCENE 4.5 · THE RANKINGS (SEO) */}
      <section className={styles.scene} data-sec data-label="The rankings">
        <div className={styles.wrap}>
          <span className={`${styles.k} ${styles.rv}`}>The rankings</span>
          <h2 className={`${styles.big} ${styles.rv} ${styles.d1}`} style={{ marginTop: 24 }}>
            The demand you&apos;re
            <br />
            <span className={styles.or}>not ranking for.</span>
          </h2>
          <p className={`${styles.sub} ${styles.rv} ${styles.d2}`} style={{ marginTop: 18 }}>
            Signal maps the searches your resolved buyers actually run — then checks where you land. This is what a
            typical SaaS account sees: real volume, real positions, real money walking to competitors.
          </p>
          <div className={`${styles.ranks} ${styles.rv} ${styles.d3}`} aria-label="Keyword ranking gaps">
            <div className={styles.rHead}>
              <span>KEYWORD</span>
              <span className={styles.rVol}>VOLUME</span>
              <span className={styles.rPos}>YOU RANK</span>
            </div>
            <div className={styles.rRow}>
              <span>customer retention software</span>
              <span className={styles.rVol}>2,400/mo</span>
              <span className={`${styles.rPos} ${styles.miss}`}>not ranking</span>
            </div>
            <div className={styles.rRow}>
              <span>appointment booking platform</span>
              <span className={styles.rVol}>1,900/mo</span>
              <span className={`${styles.rPos} ${styles.weak}`}>page 4</span>
            </div>
            <div className={styles.rRow}>
              <span>pricing automation software</span>
              <span className={styles.rVol}>1,300/mo</span>
              <span className={`${styles.rPos} ${styles.miss}`}>not ranking</span>
            </div>
            <div className={styles.rRow}>
              <span>best scheduling tool for clinics</span>
              <span className={styles.rVol}>880/mo</span>
              <span className={`${styles.rPos} ${styles.weak}`}>page 2</span>
            </div>
            <div className={styles.rRow}>
              <span>your brand name</span>
              <span className={styles.rVol}>510/mo</span>
              <span className={`${styles.rPos} ${styles.ok}`}>#1</span>
            </div>
            <div className={styles.rFoot}>
              You win the searches for your own name. You lose every search where a buyer doesn&apos;t know you yet —
              which is where the pipeline actually lives.
            </div>
          </div>
        </div>
      </section>

      {/* SCENE 5 · EXECUTE */}
      <section className={styles.scene} data-sec data-label="The engine">
        <div className={styles.wrap}>
          <span className={`${styles.k} ${styles.rv}`}>The engine</span>
          <h2 className={`${styles.big} ${styles.rv} ${styles.d1}`} style={{ marginTop: 24 }}>
            Then it acts.
          </h2>
          <p className={`${styles.sub} ${styles.rv} ${styles.d2}`} style={{ marginTop: 18 }}>
            Autopilot turns what your buyers search into pages you own — drafted, fixed, structured, and shipped on
            approval. Every change snapshotted. Every priority scored against the real buyers Signal identifies.
          </p>
          <div className={`${styles.queue} ${styles.rv} ${styles.d3}`} aria-label="Autopilot job queue">
            <div className={styles.qline}>
              <span className={styles.qn}>01</span>
              <span className={styles.qa}>CONTENT</span>
              <span>page drafted from live buyer demand</span>
              <span className={styles.qs}>awaiting approval</span>
            </div>
            <div className={styles.qline}>
              <span className={styles.qn}>02</span>
              <span className={styles.qa}>TECHNICAL</span>
              <span>canonicals, internal links, speed fixes</span>
              <span className={styles.qs}>snapshotted</span>
            </div>
            <div className={styles.qline}>
              <span className={styles.qn}>03</span>
              <span className={styles.qa}>AI SEARCH</span>
              <span>schema and citation-ready answers</span>
              <span className={styles.qs}>queued</span>
            </div>
            <div className={styles.qline}>
              <span className={styles.qn}>04</span>
              <span className={styles.qa}>CONVERSION</span>
              <span>fixes where identified buyers stall</span>
              <span className={styles.qs}>queued</span>
            </div>
            <div className={styles.qline}>
              <span className={styles.qn}>05</span>
              <span className={styles.qa}>OUTREACH</span>
              <span>the same account contacts your buyers by name</span>
              <span className={styles.qs}>hubbly os</span>
            </div>
          </div>
          <p className={`${styles.gateNote} ${styles.rv} ${styles.d3}`}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1l5 2.4v3.2c0 2.9-2.1 5.3-5 6-2.9-.7-5-3.1-5-6V3.4L7 1z"
                stroke="#FF6B35"
                strokeWidth="1.2"
              />
            </svg>
            Approval-gated by default. You review, it ships. Reversible in one click.
          </p>
        </div>
      </section>

      {/* SCENE 6 · THE NUMBER */}
      <section className={styles.scene} data-sec data-label="The number">
        <div className={styles.wrap}>
          <span className={`${styles.k} ${styles.rv}`}>The number</span>
          <h2 className={`${styles.big} ${styles.rv} ${styles.d1}`} style={{ marginTop: 24 }}>
            No seats. No retainers.
            <br />
            Pay for output.
          </h2>
          <div className={`${styles.prices} ${styles.rv} ${styles.d2}`}>
            <div className={styles.pCol}>
              <span className={styles.pn}>FREE</span>
              <div className={styles.pv}>
                $0<small>/mo</small>
              </div>
              <p className={styles.pd}>100 resolved leads a month. See who&apos;s on your site.</p>
            </div>
            <div className={styles.pCol}>
              <span className={styles.pn}>SIGNAL</span>
              <div className={styles.pv}>
                $98<small>/mo</small>
              </div>
              <p className={styles.pd}>250 resolved. Top 50 enriched with contact and intent.</p>
            </div>
            <div className={styles.pCol}>
              <span className={styles.pn}>PRO</span>
              <div className={styles.pv}>
                $298<small>/mo</small>
              </div>
              <p className={styles.pd}>1,000 resolved. Top 200 enriched. Custom verticals.</p>
            </div>
            <div className={`${styles.pCol} ${styles.hot}`}>
              <span className={styles.pn}>AUTOPILOT</span>
              <div className={styles.pv}>
                $498<small>/mo</small>
              </div>
              <p className={styles.pd}>
                Pro + the engine: pages weekly, technical fixes, AI-search placement. You approve, it ships.
              </p>
            </div>
          </div>
          <p className={`${styles.pNote} ${styles.rv} ${styles.d3}`}>
            Every paid tier starts with 14 days uncapped. Full outbound agent team →{" "}
            <a href="/" style={{ color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
              Hubbly OS
            </a>
          </p>
        </div>
      </section>

      {/* SCENE 7 · CLOSE */}
      <section className={`${styles.scene} ${styles.close}`} id="close" data-sec data-label="Your turn">
        <div className={styles.wrap}>
          <span className={`${styles.k} ${styles.rv}`}>Your turn</span>
          <h2 className={`${styles.huge} ${styles.rv} ${styles.d1}`} style={{ marginTop: 24 }}>
            This page read you.
            <br />
            <span className={styles.or}>Signal reads your market.</span>
          </h2>
          <p className={`${styles.sub} ${styles.rv} ${styles.d2}`} style={{ marginTop: 22 }}>
            One URL. Your buyers, your rankings, the demand you&apos;re losing, and the task list to win it back — in
            about 15 seconds.
          </p>
          <form className={`${styles.audit} ${styles.rv} ${styles.d3}`} action="/api/audit/form" method="post">
            <input
              type="text"
              name="url"
              inputMode="url"
              placeholder="yourcompany.com"
              aria-label="Your website URL"
              autoComplete="off"
              required
            />
            <button className={styles.btn} type="submit">
              Run free audit
            </button>
          </form>
          <p className={`${styles.fine} ${styles.rv} ${styles.d3}`}>
            FREE · NO CREDIT CARD · NOTHING FROM THIS PAGE WAS STORED
          </p>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>© 2026 THE HUBBLY CORPORATION · AUSTIN, TX</span>
        <div className={styles.lg}>
          <a href="/legal/privacy">PRIVACY</a>
          <a href="/legal/terms">TERMS</a>
          <a href="/legal/security">SECURITY</a>
          <a href="/">HUBBLY OS →</a>
        </div>
      </footer>
    </div>
  )
}
