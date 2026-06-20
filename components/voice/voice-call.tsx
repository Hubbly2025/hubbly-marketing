"use client"

import { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"

type Turn = { who: "VOICE" | "LEAD"; txt: string }

const SCRIPT: Turn[] = [
  {
    who: "VOICE",
    txt: "Hi, is this Elan? This is Nova calling from Helios Motors. You were looking at our fleet electrification rollout earlier. Are you exploring a pilot or planning for a larger transition?",
  },
  { who: "LEAD", txt: "A pilot first. If the numbers hold up, we'll expand." },
  {
    who: "VOICE",
    txt: "Perfect. I can get you in front of a fleet specialist to walk through infrastructure, range, and total cost. Does Thursday at 10:00 work?",
  },
  { who: "LEAD", txt: "Thursday works." },
  { who: "VOICE", txt: "Locked in. Confirmation is on the way now." },
]

type DispoRow = { label: string; value: string; tag?: boolean }

const DISPO: DispoRow[] = [
  { label: "Outcome", value: "Interested" },
  { label: "Intent score", value: "0.91" },
  { label: "Topic", value: "fleet electrification + pilot rollout" },
  { label: "Logged", value: "call recording + transcript", tag: true },
  { label: "Owner", value: "Nova · first contact wins" },
]

function PanelBar({ title, liveLabel }: { title: string; liveLabel: string }) {
  return (
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
  )
}

export function VoiceCall() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [played, setPlayed] = useState(false)
  const [visibleTurns, setVisibleTurns] = useState(0)
  const [visibleDispo, setVisibleDispo] = useState(0)
  const [showNext, setShowNext] = useState(false)

  useEffect(() => {
    const node = rootRef.current
    if (!node) return

    const reduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (reduced) {
      setVisibleTurns(SCRIPT.length)
      setVisibleDispo(DISPO.length)
      setShowNext(true)
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

    SCRIPT.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleTurns((n) => Math.max(n, i + 1)), 950 * i + 400))
    })

    const dispoStart = 950 * SCRIPT.length + 400 + 700
    DISPO.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleDispo((n) => Math.max(n, i + 1)), dispoStart + 240 * i))
    })
    timers.push(setTimeout(() => setShowNext(true), dispoStart + 240 * DISPO.length + 300))

    return () => timers.forEach(clearTimeout)
  }, [played])

  return (
    <div className="mt-14 grid grid-cols-1 items-stretch gap-[18px] lg:grid-cols-2">
      {/* Transcript */}
      <div className="overflow-hidden border border-border bg-card" aria-label="Live call transcript">
        <PanelBar title="voice — outbound call · lead #4471" liveLabel="ON CALL" />
        <div ref={rootRef} className="min-h-[316px] p-[18px]">
          {SCRIPT.map((turn, i) => (
            <div
              key={i}
              className={cn(
                "mb-[11px] flex gap-[10px] transition-all duration-500",
                i < visibleTurns ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
              )}
            >
              <span
                className={cn(
                  "min-w-[54px] pt-[2px] font-mono text-[10px] tracking-[0.1em]",
                  turn.who === "VOICE" ? "text-accent" : "text-muted-foreground",
                )}
              >
                {turn.who}
              </span>
              <span
                className={cn(
                  "flex-1 text-[13px] leading-normal",
                  turn.who === "VOICE" ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {turn.txt}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Disposition */}
      <div className="overflow-hidden border border-border bg-card" aria-label="Call outcome and next step">
        <div className="border-b border-border/60 px-[18px] py-[14px] font-mono text-[10px] tracking-[0.18em] text-accent">
          CALL OUTCOME · LOGGED AUTOMATICALLY
        </div>
        <div>
          {DISPO.map((row, i) => (
            <div
              key={row.label}
              className={cn(
                "flex items-center justify-between border-t border-border/60 px-[18px] py-[13px] font-mono text-[12px] text-muted-foreground transition-all duration-500 first:border-t-0",
                i < visibleDispo ? "translate-x-0 opacity-100" : "-translate-x-1.5 opacity-0",
              )}
            >
              <span>{row.label}</span>
              <span className={cn("font-medium", row.tag ? "text-green-500" : "text-foreground")}>{row.value}</span>
            </div>
          ))}
          <div
            className={cn(
              "mx-[18px] mb-[18px] mt-[14px] rounded-[10px] border border-accent/40 p-[14px] font-mono text-[11px] leading-relaxed text-muted-foreground transition-opacity duration-500",
              showNext ? "opacity-100" : "opacity-0",
            )}
          >
            NEXT STEP · AUTO-SCHEDULED
            <br />
            <b className="font-medium text-accent">→ Meeting booked: Thursday 10:00 AM</b> · confirmation sent · owner
            notified
          </div>
        </div>
      </div>
    </div>
  )
}
