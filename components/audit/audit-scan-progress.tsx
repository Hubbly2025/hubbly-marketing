"use client"

import { useEffect, useState } from "react"

const ROTATING_MESSAGES = [
  "Counting the revenue leaking out of page two.",
  "Somebody's ranking for your money terms. Naming them now.",
  "Your competitors already ran this. Catching you up.",
  "This is the part your agency bills 40 hours for.",
  "McKinsey and Tesla had a one-night stand. Nine months later, Hubbly was born.",
]

const ROTATION_MS = 7000
const CROSSFADE_MS = 300

export function AuditScanProgress({
  step = "building report",
  percent = 75,
}: {
  step?: string
  percent?: number
}) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    let swapTimeout: number | undefined

    const rotate = window.setInterval(() => {
      setVisible(false)
      swapTimeout = window.setTimeout(() => {
        setIndex((current) => (current + 1) % ROTATING_MESSAGES.length)
        setVisible(true)
      }, CROSSFADE_MS)
    }, ROTATION_MS)

    return () => {
      window.clearInterval(rotate)
      if (swapTimeout) window.clearTimeout(swapTimeout)
    }
  }, [])

  const safePercent = Math.max(0, Math.min(100, Math.round(percent)))

  return (
    <main
      className="flex min-h-[100svh] flex-col items-center bg-[#0e0e0e] px-6 py-8 text-[#e8e8e8]"
      style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
    >
      {/* Logo header */}
      <a
        href="/"
        aria-label="Hubbly home"
        className="inline-flex items-center gap-3"
      >
        <span className="flex h-8 w-8 items-center justify-center border border-[#FF6B35]">
          <svg className="h-4 w-4 text-[#FF6B35]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" />
            <path d="M8.5 9.5L12 7.5L15.5 9.5V14.5L12 16.5L8.5 14.5V9.5Z" />
          </svg>
        </span>
        <span className="text-xs uppercase tracking-[0.3em] text-[#a5a5a5]">
          Hubbly<span className="text-[#FF6B35]">.io</span>
        </span>
      </a>

      {/* Card */}
      <section className="mt-8 flex w-full max-w-[640px] flex-1 flex-col border border-[#1a1a1a] p-6 md:p-10">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[#FF6B35]">GTM audit running</p>
        <h1
          className="mt-4 text-5xl font-normal leading-[1.05] tracking-tight text-[#f5f5f5] md:text-6xl"
          style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
        >
          Building your report
        </h1>

        {/* Flexible spacer pushes the status block to the bottom of the card */}
        <div className="flex-1" />

        {/* Orange rule / progress bar */}
        <div className="mt-10 h-px w-full bg-[#2a1a12]">
          <div
            className="h-px bg-[#FF6B35] transition-[width] duration-500 ease-out"
            style={{ width: `${safePercent}%` }}
          />
        </div>

        {/* Rotating status message */}
        <div className="mt-5 min-h-[6rem] md:min-h-[4.5rem]">
          <p
            className="text-sm leading-relaxed text-[#8a8a8a] transition-opacity duration-300"
            style={{ opacity: visible ? 1 : 0 }}
          >
            {ROTATING_MESSAGES[index]}
          </p>
        </div>

        {/* Step line */}
        <p className="mt-4 text-sm text-[#b0b0b0]">
          Current step: {step} · {safePercent}%
        </p>
      </section>
    </main>
  )
}
