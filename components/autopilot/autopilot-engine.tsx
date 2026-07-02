"use client"

import { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"

type QueueItem = {
  cat: string
  txt: string
  status: string
  awaiting?: boolean
}

const QUEUE: QueueItem[] = [
  { cat: "STRATEGY", txt: "plan rebuilt from rankings + live demand", status: "continuous" },
  { cat: "KEYWORDS", txt: "14 targets scored by pipeline relevance", status: "continuous" },
  { cat: "CONTENT", txt: "fleet-electrification-rollout.html drafted", status: "awaiting approval", awaiting: true },
  { cat: "TECHNICAL", txt: "canonical + 6 internal links applied", status: "snapshotted" },
  { cat: "AI SEARCH", txt: "FAQ schema + entity markup added", status: "queued" },
  { cat: "CONVERSION", txt: "contact flow moved above the fold", status: "queued" },
  { cat: "LOCAL", txt: "3 service-area pages refreshed", status: "monitored" },
  { cat: "PIPELINE", txt: "7 changes traced to 312 buyers", status: "logged" },
]

type CodeLine = { num: string; node: React.ReactNode }

const CODE: CodeLine[] = [
  {
    num: "1",
    node: (
      <>
        <span className="text-[#d98c6a]">{"<title>"}</span>Fleet Electrification Rollout for Enterprise Teams |
        Helios Motors
        <span className="text-[#d98c6a]">{"</title>"}</span>
      </>
    ),
  },
  {
    num: "2",
    node: (
      <>
        <span className="text-[#d98c6a]">{"<meta"}</span> <span className="text-muted-foreground">name</span>=
        <span className="text-green-500">{'"description"'}</span>{" "}
        <span className="text-muted-foreground">content</span>=
        <span className="text-green-500">{'"Evaluate pilot fleet electrification..."'}</span>
        <span className="text-[#d98c6a]">{">"}</span>
      </>
    ),
  },
  { num: "3", node: null },
  { num: "4", node: <span className="text-muted-foreground/60">{"// crawler: structure + canonical"}</span> },
  {
    num: "5",
    node: (
      <>
        <span className="text-[#d98c6a]">{"<link"}</span> <span className="text-muted-foreground">rel</span>=
        <span className="text-green-500">{'"canonical"'}</span> <span className="text-muted-foreground">href</span>=
        <span className="text-green-500">{'"/fleet-electrification-rollout"'}</span>
        <span className="text-[#d98c6a]">{">"}</span>
      </>
    ),
  },
  { num: "6", node: null },
  { num: "7", node: <span className="text-muted-foreground/60">{"// model: answer-first + schema"}</span> },
  {
    num: "8",
    node: (
      <>
        <span className="text-[#d98c6a]">{"<h1>"}</span>How does fleet electrification rollout work for enterprise
        teams?
        <span className="text-[#d98c6a]">{"</h1>"}</span>
      </>
    ),
  },
  { num: "9", node: <span className="text-green-500">{'+ <script type="application/ld+json">'}</span> },
  { num: "10", node: <span className="text-green-500">{'+   "@type": "FAQPage" ...'}</span> },
  { num: "11", node: <span className="text-green-500">{"+ </script>"}</span> },
  { num: "12", node: <span className="text-green-500">{"✓ structured for crawler + model"}</span> },
]

function Panel({
  title,
  liveLabel,
  children,
}: {
  title: string
  liveLabel: string
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border/60 bg-secondary px-4 py-3">
        <span className="h-[9px] w-[9px] rounded-full bg-muted" />
        <span className="h-[9px] w-[9px] rounded-full bg-muted" />
        <span className="h-[9px] w-[9px] rounded-full bg-muted" />
        <span className="ml-2 font-mono text-[10.5px] tracking-[0.08em] text-muted-foreground/70">{title}</span>
        <span className="ml-auto flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] text-accent">
          <span className="h-[6px] w-[6px] animate-pulse rounded-full bg-accent" />
          {liveLabel}
        </span>
      </div>
      <div className="min-h-[300px] p-[18px]">{children}</div>
    </div>
  )
}

export function AutopilotEngine() {
  const queueRef = useRef<HTMLDivElement>(null)
  const [played, setPlayed] = useState(false)
  const [visibleRows, setVisibleRows] = useState(0)
  const [liveLines, setLiveLines] = useState(0)

  useEffect(() => {
    const node = queueRef.current
    if (!node) return

    const reduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (reduced) {
      setVisibleRows(QUEUE.length)
      setLiveLines(CODE.length)
      setPlayed(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !played) {
          setPlayed(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [played])

  useEffect(() => {
    if (!played) return
    const timers: ReturnType<typeof setTimeout>[] = []

    QUEUE.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleRows((n) => Math.max(n, i + 1)), 360 * i + 200))
    })
    CODE.forEach((_, i) => {
      timers.push(setTimeout(() => setLiveLines((n) => Math.max(n, i + 1)), 320 * i + 600))
    })

    return () => timers.forEach(clearTimeout)
  }, [played])

  return (
    <div className="mt-14 grid grid-cols-1 gap-[18px] lg:grid-cols-2">
      {/* Work queue */}
      <Panel title="rank — work queue" liveLabel="LIVE">
        <div ref={queueRef} className="font-mono text-[12px] leading-[1.95]">
          {QUEUE.map((row, i) => (
            <div
              key={row.cat}
              className={cn(
                "flex items-baseline gap-[10px] py-[7px] transition-all duration-500",
                i < visibleRows ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
              )}
            >
              <span className="min-w-[92px] tracking-[0.04em] text-accent">{row.cat}</span>
              <span className="flex-1 text-muted-foreground">{row.txt}</span>
              <span
                className={cn(
                  "whitespace-nowrap text-[10px]",
                  row.awaiting ? "text-muted-foreground/60" : "text-green-500",
                )}
              >
                {row.status}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Code build */}
      <Panel title="drafting — fleet-electrification-rollout.html" liveLabel="BUILDING">
        <div className="font-mono text-[11.5px] leading-[1.9]">
          {CODE.map((line, i) => (
            <div
              key={line.num}
              className={cn("flex gap-3 transition-opacity duration-500", i < liveLines ? "opacity-100" : "opacity-30")}
            >
              <span className="min-w-[18px] text-right text-muted-foreground/50">{line.num}</span>
              <span>{line.node ?? "\u00A0"}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
