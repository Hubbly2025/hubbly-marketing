"use client"

/**
 * The live work feed — a lead progressing to a booked, recorded outcome.
 *
 * Reused by the hero and by the Hubbly OS homepage insert, which is why the
 * steps are a prop rather than hardcoded.
 *
 * Motion rules it has to obey:
 *   - pauses on hover and on focus-within, so it can't animate away under a
 *     cursor or while someone is reading it with a keyboard
 *   - does not animate at all under prefers-reduced-motion; it renders the
 *     completed state instead, which is also the correct static fallback
 *
 * The cycle is illustrative, so it is exposed to assistive tech as a labelled
 * static list, not a live region that would announce on every tick.
 */

import { useEffect, useState } from "react"

export function WorkFeed({
  steps,
  label = "EXAMPLE",
  status,
}: {
  steps: readonly string[]
  label?: string
  /**
   * Optional software-operation signal (e.g. "AUTONOMOUS TEAM ACTIVE"). Shown
   * as interface chrome above the feed to reinforce that active software agents
   * are doing this work. Omitted where the feed is used purely illustratively.
   */
  status?: string
}) {
  // Start fully complete: correct for reduced motion, no-JS, and first paint.
  const [activeIndex, setActiveIndex] = useState(steps.length - 1)
  const [paused, setPaused] = useState(false)
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    setAnimate(!query.matches)

    const onChange = (event: MediaQueryListEvent) => setAnimate(!event.matches)
    query.addEventListener("change", onChange)
    return () => query.removeEventListener("change", onChange)
  }, [])

  useEffect(() => {
    if (!animate || paused) return

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % (steps.length + 1))
    }, 1400)

    return () => window.clearInterval(timer)
  }, [animate, paused, steps.length])

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="border border-border bg-card"
    >
      {/* Software-operation signal. Sits above the feed so the panel reads as
          "agents are running" before the individual steps are scanned. */}
      {status && (
        <div className="flex items-center gap-2 border-b border-border/60 bg-secondary px-4 py-2.5">
          <span className="animate-pulse size-1.5 rounded-full bg-accent" aria-hidden="true" />
          <span className="font-mono text-[10px] tracking-[0.18em] text-accent">{status}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          {/* When a status row is present it already carries the live dot, so
              this one would be a duplicate signal. */}
          {!status && <span className="animate-pulse size-1.5 rounded-full bg-accent" aria-hidden="true" />}
          <span className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground">WORK FEED</span>
        </div>
        <span className="border border-border/60 bg-secondary px-2 py-0.5 font-mono text-[9px] tracking-[0.16em] text-muted-foreground/70">
          {label}
        </span>
      </div>

      <ol aria-label="Example call outcome sequence" className="flex flex-col">
        {steps.map((step, index) => {
          const done = index <= activeIndex
          return (
            <li
              key={step}
              className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-b-0"
            >
              <span
                aria-hidden="true"
                className={`size-1.5 shrink-0 rounded-full transition-colors duration-300 ${
                  done ? "bg-accent" : "bg-muted"
                }`}
              />
              <span
                className={`font-mono text-[11px] tracking-[0.12em] transition-colors duration-300 ${
                  done ? "text-foreground" : "text-muted-foreground/70"
                }`}
              >
                {step}
              </span>
              {done && (
                <span className="ml-auto font-mono text-[10px] text-accent" aria-hidden="true">
                  ✓
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
