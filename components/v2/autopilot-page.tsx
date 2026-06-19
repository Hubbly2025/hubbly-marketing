"use client"

import { useEffect, useRef, useState } from "react"
import styles from "@/app/autopilot/autopilot.module.css"

type QueueItem = {
  cat: string
  txt: string
  status: string
  wait?: boolean
}

const QUEUE: QueueItem[] = [
  { cat: "STRATEGY", txt: "plan rebuilt from rankings + live demand", status: "continuous" },
  { cat: "KEYWORDS", txt: "14 targets scored by pipeline relevance", status: "continuous" },
  { cat: "CONTENT", txt: "roof-financing-options.html drafted", status: "awaiting approval", wait: true },
  { cat: "TECHNICAL", txt: "canonical + 6 internal links applied", status: "snapshotted" },
  { cat: "AI SEARCH", txt: "FAQ schema + entity markup added", status: "queued" },
  { cat: "CONVERSION", txt: "quote form moved above the fold", status: "queued" },
  { cat: "LOCAL", txt: "3 service-area pages refreshed", status: "monitored" },
  { cat: "PIPELINE", txt: "7 changes traced to 312 buyers", status: "logged" },
]

const CODE: { g: string; html: string }[] = [
  { g: "1", html: `<span class="${styles.tag}">&lt;title&gt;</span>Roof Financing Options in Austin | Acme<span class="${styles.tag}">&lt;/title&gt;</span>` },
  { g: "2", html: `<span class="${styles.tag}">&lt;meta</span> <span class="${styles.at}">name</span>=<span class="${styles.st}">"description"</span> <span class="${styles.at}">content</span>=<span class="${styles.st}">"Compare roof financing..."</span><span class="${styles.tag}">&gt;</span>` },
  { g: "3", html: "" },
  { g: "4", html: `<span class="${styles.cm}">// crawler: structure + canonical</span>` },
  { g: "5", html: `<span class="${styles.tag}">&lt;link</span> <span class="${styles.at}">rel</span>=<span class="${styles.st}">"canonical"</span> <span class="${styles.at}">href</span>=<span class="${styles.st}">"/roof-financing-options"</span><span class="${styles.tag}">&gt;</span>` },
  { g: "6", html: "" },
  { g: "7", html: `<span class="${styles.cm}">// model: answer-first + schema</span>` },
  { g: "8", html: `<span class="${styles.tag}">&lt;h1&gt;</span>How much does roof financing cost?<span class="${styles.tag}">&lt;/h1&gt;</span>` },
  { g: "9", html: `<span class="${styles.add}">+ &lt;script type="application/ld+json"&gt;</span>` },
  { g: "10", html: `<span class="${styles.add}">+   "@type": "FAQPage" ...</span>` },
  { g: "11", html: `<span class="${styles.add}">+ &lt;/script&gt;</span>` },
  { g: "12", html: `<span class="${styles.st}">✓ structured for crawler + model</span>` },
]

export default function AutopilotPage() {
  const queueRef = useRef<HTMLDivElement>(null)
  const [visibleQueue, setVisibleQueue] = useState<number>(0)
  const [liveCode, setLiveCode] = useState<number>(0)
  const playedRef = useRef(false)

  // Scroll reveals
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add(styles.in)
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.16 },
    )
    document.querySelectorAll(`.${styles.rv}`).forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  // Autoplay queue + code build when hero panels come into view
  useEffect(() => {
    const node = queueRef.current
    if (!node) return

    const timeouts: ReturnType<typeof setTimeout>[] = []

    const io = new IntersectionObserver(
      (entries, obs) => {
        if (entries[0].isIntersecting && !playedRef.current) {
          playedRef.current = true
          QUEUE.forEach((_, i) => {
            timeouts.push(setTimeout(() => setVisibleQueue((n) => Math.max(n, i + 1)), 360 * i + 200))
          })
          CODE.forEach((_, i) => {
            timeouts.push(setTimeout(() => setLiveCode((n) => Math.max(n, i + 1)), 320 * i + 600))
          })
          obs.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(node)

    return () => {
      io.disconnect()
      timeouts.forEach(clearTimeout)
    }
  }, [])

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <a className={styles.logo} href="/">
          HUBBLY<span className={styles.or}>.</span>
        </a>
        <a className={styles.navCta} href="#close">
          RUN FREE AUDIT
        </a>
      </nav>

      {/* HERO */}
      <header className={`${styles.scene} ${styles.tall}`}>
        <div className={styles.wrap}>
          <span className={`${styles.k} ${styles.rv}`}>Autopilot · the execution engine</span>
          <h1 className={`${styles.huge} ${styles.rv} ${styles.d1}`} style={{ marginTop: 22 }}>
            Your SEO team,
            <br />
            <span className={styles.or}>running itself.</span>
          </h1>
          <p className={`${styles.sub} ${styles.rv} ${styles.d2}`} style={{ marginTop: 22 }}>
            Autopilot turns what your buyers search into pages you own — content, technical fixes, schema, and
            AI-answer placement. The first 90 days build the foundation. Then the engine never stops. Every task
            approval-gated, every change snapshotted and reversible.
          </p>
          <div className={styles.engine}>
            <div className={`${styles.panel} ${styles.rv} ${styles.d2}`} aria-label="Live work queue">
              <div className={styles.pBar}>
                <span className={styles.pDot} />
                <span className={styles.pDot} />
                <span className={styles.pDot} />
                <span className={styles.pTitle}>autopilot — work queue</span>
                <span className={styles.pLive}>
                  <span className={styles.pulse} />
                  LIVE
                </span>
              </div>
              <div className={styles.pBody} ref={queueRef}>
                {QUEUE.map((r, i) => (
                  <div key={r.cat} className={`${styles.qrow} ${i < visibleQueue ? styles.show : ""}`}>
                    <span className={styles.qcat}>{r.cat}</span>
                    <span className={styles.qtxt}>{r.txt}</span>
                    <span className={`${styles.qst} ${r.wait ? styles.wait : ""}`}>{r.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={`${styles.panel} ${styles.rv} ${styles.d3}`} aria-label="A page being built">
              <div className={styles.pBar}>
                <span className={styles.pDot} />
                <span className={styles.pDot} />
                <span className={styles.pDot} />
                <span className={styles.pTitle}>drafting — roof-financing-options.html</span>
                <span className={styles.pLive}>
                  <span className={styles.pulse} />
                  BUILDING
                </span>
              </div>
              <div className={`${styles.pBody} ${styles.code}`}>
                {CODE.map((l, i) => (
                  <div key={l.g} className={`${styles.ln} ${i < liveCode ? styles.live : ""}`}>
                    <span className={styles.g}>{l.g}</span>
                    <span dangerouslySetInnerHTML={{ __html: l.html || "&nbsp;" }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* SCOREBOARDS */}
      <div className={styles.scoreboards} aria-label="Built for both scoreboards">
        <div className={styles.wrap}>
          <p className={styles.sbLabel}>BUILT FOR BOTH SCOREBOARDS</p>
          <div className={styles.sbIn}>
            <div className={styles.sbSide}>
              <span className={styles.sbPos}>
                <span>#1</span>
                <span>#2</span>
                <span>#3</span>
              </span>
              <span>Search rankings</span>
            </div>
            <div className={styles.sbMid}>
              <span>One engine. Both result pages.</span>
            </div>
            <div className={styles.sbSide}>
              <span>AI answers</span>
              <span className={styles.sbEngines}>ChatGPT · Perplexity · Grok · Gemini</span>
            </div>
          </div>
        </div>
      </div>

      {/* DUAL READER */}
      <section className={styles.scene}>
        <div className={styles.wrap}>
          <span className={`${styles.k} ${styles.rv}`}>The shift</span>
          <h2 className={`${styles.big} ${styles.rv} ${styles.d1}`} style={{ marginTop: 16 }}>
            Google is no longer
            <br />
            the only scoreboard.
          </h2>
          <p className={`${styles.sub} ${styles.rv} ${styles.d2}`} style={{ marginTop: 16 }}>
            Buyers ask AI engines now. Every page Autopilot ships is structured for two readers — the crawler that
            ranks you and the model that cites you. Same pass, same page.
          </p>
          <div className={styles.readers}>
            <div className={`${styles.reader} ${styles.rv} ${styles.d2}`}>
              <div className={styles.ri}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="#FF6B35" strokeWidth="1.4" />
                  <path d="M11 3v16M3 11h16" stroke="#FF6B35" strokeWidth="1.4" />
                </svg>
                <h3>The crawler</h3>
              </div>
              <p>
                Clean structure, fast load, internal links, canonical clarity, and the keyword targets your buyers
                actually ran — the inputs that move you up the rankings.
              </p>
              <div className={styles.chips}>
                <span>META</span>
                <span>CANONICAL</span>
                <span>INTERNAL LINKS</span>
                <span>SITEMAP</span>
                <span>SPEED</span>
              </div>
            </div>
            <div className={`${styles.reader} ${styles.rv} ${styles.d3}`}>
              <div className={styles.ri}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="3" y="3" width="16" height="16" rx="3" stroke="#FF6B35" strokeWidth="1.4" />
                  <path d="M7 8h8M7 11h8M7 14h5" stroke="#FF6B35" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <h3>The model</h3>
              </div>
              <p>
                Structured data, entity clarity, and citation-ready answers under the questions buyers ask — the
                inputs AI engines use to decide who gets named in the answer.
              </p>
              <div className={styles.chips}>
                <span>JSON-LD</span>
                <span>ENTITIES</span>
                <span>ANSWER BLOCKS</span>
                <span>SCHEMA</span>
                <span>llms.txt</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CAPABILITY GRID */}
      <section className={`${styles.scene} ${styles.surfaceScene}`}>
        <div className={styles.wrap}>
          <span className={`${styles.k} ${styles.rv}`}>What it executes</span>
          <h2 className={`${styles.big} ${styles.rv} ${styles.d1}`} style={{ marginTop: 16 }}>
            Everything an SEO operator does.
            <br />
            Every week. Forever.
          </h2>
          <p className={`${styles.sub} ${styles.rv} ${styles.d2}`} style={{ marginTop: 16 }}>
            Every task scored against the real buyers Signal identifies on your site — pipeline relevance first,
            traffic second.
          </p>
          <div className={`${styles.caps} ${styles.rv} ${styles.d2}`}>
            {[
              ["01", "SEO strategy", "A living plan rebuilt from your rankings, your buyers, and what they search — not a static audit PDF."],
              ["02", "Keyword research", "Targets scored by pipeline relevance — the queries your identified buyers actually ran."],
              ["03", "Content", "New pages and refreshes drafted weekly, briefed from live demand, queued for your approval."],
              ["04", "Technical SEO", "Crawl issues, canonicals, internal links, and speed — applied with snapshots, reversible in one click."],
              ["05", "AI answer visibility", "Schema, entities, and citation-ready content — optimized for the answer box and the AI answer in the same pass."],
              ["06", "Authority", "Internal link architecture and supporting content that compounds what already works on your site."],
              ["07", "Conversion", "Page-level fixes where identified buyers stall — forms, calls to action, proof, and layout."],
              ["08", "Local", "Profiles, citations, and service-area pages kept accurate, consistent, and working."],
              ["09", "Pipeline", "Every task traced from signal to published change to the buyers it reached."],
            ].map(([cn, title, body]) => (
              <div key={cn} className={styles.cap}>
                <span className={styles.cn}>{cn}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTROL */}
      <section className={styles.scene}>
        <div className={styles.wrap}>
          <span className={`${styles.k} ${styles.rv}`}>Control</span>
          <h2 className={`${styles.big} ${styles.rv} ${styles.d1}`} style={{ marginTop: 16 }}>
            It does the work.
            <br />
            <span className={styles.or}>You make the calls.</span>
          </h2>
          <p className={`${styles.sub} ${styles.rv} ${styles.d2}`} style={{ marginTop: 16 }}>
            Autonomy without discipline is a liability. Autopilot ships nothing you haven't approved, and can undo
            anything it ships.
          </p>
          <div className={`${styles.gateStrip} ${styles.rv} ${styles.d2}`}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 1l7 3.4v4.5c0 4-2.9 7.3-7 8.1-4.1-.8-7-4.1-7-8.1V4.4L10 1z" stroke="#FF6B35" strokeWidth="1.3" />
              <path d="M6.5 10l2.3 2.3L14 7.5" stroke="#FF6B35" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <div>
              <b>Approval-gated by default. Snapshot before every change. One-click rollback.</b>
              <br />
              <span>
                You review the queue, approve what ships, and the system keeps a full history it can always reverse.
                This isn't a 90-day project — it's a permanent member of your team.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* RETENTION TIMELINE */}
      <section className={`${styles.scene} ${styles.surfaceScene}`}>
        <div className={styles.wrap}>
          <span className={`${styles.k} ${styles.rv}`}>The first year</span>
          <h2 className={`${styles.big} ${styles.rv} ${styles.d1}`} style={{ marginTop: 16 }}>
            Foundation first.
            <br />
            Then it compounds.
          </h2>
          <div className={`${styles.timeline} ${styles.rv} ${styles.d2}`}>
            {[
              ["STAGE 01", "Foundation", "Technical health, indexed pages, schema, and AI-answer structure. The groundwork the engine builds on.", "DAYS 0–90"],
              ["STAGE 02", "Traction", "Content shipping weekly against live demand. Rankings and citations start moving on the terms your buyers run.", "MONTHS 3–6"],
              ["STAGE 03", "Momentum", "Authority compounds. The pages you own start feeding pipeline, not just traffic.", "MONTHS 6–9"],
              ["STAGE 04", "Compounding", "A library of owned pages working for you around the clock — search and AI both. The engine never stops.", "MONTHS 9–12"],
            ].map(([pn, title, body, days]) => (
              <div key={pn} className={styles.phase}>
                <span className={styles.pn}>{pn}</span>
                <h3>{title}</h3>
                <p>{body}</p>
                <div className={styles.days}>{days}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHERE IT FITS */}
      <section className={styles.scene}>
        <div className={styles.wrap}>
          <span className={`${styles.k} ${styles.rv}`}>Where it fits</span>
          <h2 className={`${styles.big} ${styles.rv} ${styles.d1}`} style={{ marginTop: 16 }}>
            Autopilot owns the demand.
            <br />
            The rest of Hubbly acts on it.
          </h2>
          <p className={`${styles.sub} ${styles.rv} ${styles.d2}`} style={{ marginTop: 16 }}>
            Signal sees your buyers. Autopilot wins the search and AI demand they represent. And where SEO tools stop,
            Hubbly keeps going — the same account writes the outreach, places the calls, and books the meetings.
          </p>
          <p className={`${styles.fitLinks} ${styles.rv} ${styles.d2}`}>
            <a href="/signal">SEE SIGNAL →</a>
            <a href="/">SEE THE FULL OS →</a>
          </p>
        </div>
      </section>

      {/* CLOSE */}
      <section className={`${styles.scene} ${styles.close}`} id="close">
        <div className={styles.wrap}>
          <span className={`${styles.k} ${styles.rv}`}>Your turn</span>
          <h2 className={`${styles.huge} ${styles.rv} ${styles.d1}`} style={{ marginTop: 18 }}>
            See the task list
            <br />
            <span className={styles.or}>it would run for you.</span>
          </h2>
          <p className={`${styles.sub} ${styles.rv} ${styles.d2}`} style={{ marginTop: 20 }}>
            Drop your URL. Get the rankings you're losing, the AI answers you're missing, and the exact queue
            Autopilot would execute — free, in about 15 seconds.
          </p>
          <form className={`${styles.audit} ${styles.rv} ${styles.d3}`} action="/api/audit/form" method="post">
            <input type="text" name="url" inputMode="url" placeholder="yourcompany.com" aria-label="Your website URL" autoComplete="off" required />
            <button className={styles.btn} type="submit">
              Run free audit
            </button>
          </form>
          <p className={`${styles.fine} ${styles.rv} ${styles.d3}`}>
            FREE · NO CREDIT CARD · NOTHING PUBLISHES WITHOUT YOUR APPROVAL
          </p>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>© 2026 THE HUBBLY CORPORATION · AUSTIN, TX</span>
        <div className={styles.lg}>
          <a href="/">HUBBLY OS</a>
          <a href="/signal">SIGNAL</a>
          <a href="/architecture">ARCHITECTURE</a>
          <a href="/legal/privacy">PRIVACY</a>
        </div>
      </footer>
    </div>
  )
}
