import { useEffect, useRef, useState, type ReactNode } from "react"

export type Metrics = {
  elapsed: string
  depth: number
  score: number
  sections: number
  totalSections: number
  pace: string
  move: string
  back: boolean
}

export const TOTAL_SECTIONS = 6

export function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

export function HudRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-3 py-1.5 text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

export function BootLine({ show, children }: { show: boolean; children: ReactNode }) {
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

/** A single styled run of text within a terminal line. */
export type BootSegment = { t: string; c?: string }

/** Reveal the first `count` characters across a line's styled segments. */
function revealSegments(segments: BootSegment[], count: number) {
  let remaining = count
  const out: ReactNode[] = []
  for (let i = 0; i < segments.length; i++) {
    if (remaining <= 0) break
    const seg = segments[i]
    out.push(
      <span key={i} className={seg.c}>
        {seg.t.slice(0, remaining)}
      </span>,
    )
    remaining -= seg.t.length
  }
  return out
}

/**
 * TerminalBoot types each line out character-by-character with a blinking
 * accent caret that flows from line to line — making the session read feel
 * live instead of static. Calls `onComplete` once the final line finishes.
 */
export function TerminalBoot({
  lines,
  start,
  reduceMotion = false,
  onComplete,
}: {
  lines: BootSegment[][]
  start: boolean
  reduceMotion?: boolean
  onComplete?: () => void
}) {
  const [pos, setPos] = useState<{ line: number; char: number }>({ line: 0, char: 0 })
  const [done, setDone] = useState(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const lineLengths = lines.map((segs) => segs.reduce((n, s) => n + s.t.length, 0))

  useEffect(() => {
    if (!start) return

    if (reduceMotion) {
      setPos({ line: lines.length - 1, char: lineLengths[lines.length - 1] ?? 0 })
      setDone(true)
      onCompleteRef.current?.()
      return
    }

    setPos({ line: 0, char: 0 })
    setDone(false)

    let line = 0
    let char = 0
    let timer = 0

    const tick = () => {
      const len = lineLengths[line] ?? 0
      if (char < len) {
        char++
        setPos({ line, char })
        timer = window.setTimeout(tick, 15 + Math.random() * 26)
      } else if (line < lines.length - 1) {
        line++
        char = 0
        setPos({ line, char })
        timer = window.setTimeout(tick, 360)
      } else {
        setDone(true)
        onCompleteRef.current?.()
      }
    }

    timer = window.setTimeout(tick, 300)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, reduceMotion])

  return (
    <div className="min-h-[8.5em]">
      {lines.map((segs, li) => {
        const fullyTyped = done || li < pos.line
        const isActive = !done && li === pos.line
        const started = fullyTyped || isActive
        const reveal = fullyTyped ? lineLengths[li] : isActive ? pos.char : 0
        const fullText = segs.map((s) => s.t).join("")
        const showCaret = isActive || (done && li === lines.length - 1)
        return (
          <div
            key={li}
            className={`flex items-baseline font-mono text-[clamp(13px,1.5vw,15px)] leading-[2.3] text-muted-foreground transition-opacity duration-300 ${
              started ? "opacity-100" : "opacity-0"
            }`}
          >
            <span aria-hidden="true" className="mr-2 flex-none select-none text-accent/55">
              {"\u203a"}
            </span>
            <span aria-hidden="true">{revealSegments(segs, reveal)}</span>
            <span className="sr-only">{fullText}</span>
            {showCaret ? (
              <span
                aria-hidden="true"
                className="animate-signal-caret ml-0.5 inline-block h-[1.05em] w-[0.55ch] translate-y-[0.16em] bg-accent"
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export function MirrorRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between border-t border-border py-2.5 text-[12.5px] text-muted-foreground">
      <span>{label}</span>
      <span className={`text-right ${accent ? "text-accent" : "text-foreground"}`}>{value}</span>
    </div>
  )
}

export function SampleQuery({ query, volume }: { query: string; volume: string }) {
  return (
    <div className="flex justify-between py-1.5 font-mono text-[12px] text-muted-foreground">
      <span>{query}</span>
      <span className="text-muted-foreground/60">{volume}</span>
    </div>
  )
}

export function QueueLine({ n, action, desc, status }: { n: string; action: string; desc: string; status: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-3.5 border-t border-border/70 py-4 text-muted-foreground/70 last:border-b last:border-border/70">
      <span className="min-w-[28px] text-muted-foreground/40">{n}</span>
      <span className="min-w-[110px] tracking-[0.08em] text-foreground/80 md:min-w-[160px]">{action}</span>
      <span className="text-[12.5px]">{desc}</span>
      <span className="ml-auto text-[10.5px] tracking-[0.04em] text-[oklch(0.78_0.08_150)]">{status}</span>
    </div>
  )
}

export function PriceCol({
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
      className={`flex min-h-[248px] flex-col p-8 ${
        hot ? "bg-[linear-gradient(180deg,oklch(0.7_0.2_45_/_0.08),transparent_65%),var(--background)]" : "bg-background"
      }`}
    >
      <span className={`font-mono text-[10px] tracking-[0.22em] ${hot ? "text-accent" : "text-muted-foreground/55"}`}>
        {name}
      </span>
      <div className="mb-1 mt-4 font-[var(--font-bebas)] text-[clamp(30px,3.4vw,40px)] font-semibold leading-none tracking-tight text-foreground/90">
        {price}
        <small className="ml-0.5 font-mono text-[12px] font-normal tracking-normal text-muted-foreground/55">
          {unit}
        </small>
      </div>
      <p className="mt-auto pt-5 text-[12.5px] leading-relaxed text-muted-foreground/70">{desc}</p>
    </div>
  )
}
