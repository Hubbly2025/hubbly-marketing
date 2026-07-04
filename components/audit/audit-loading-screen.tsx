"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import ScanTheater, { type ScanEvent } from "@/components/audit/scan-theater"
import type { Audit } from "@/components/audit/types"
import { getDomain } from "@/components/audit/audit-utils"

type AuditStatus = "processing" | "complete" | "failed"

// Backend `current_step` values come from lib/audit/process-audit.ts:
// queued → scraping → analyzing → building_report → complete | failed.
// Map each to honest, human copy. Nothing here invents scan findings — the
// globe only shows the domain node + wire sphere while these play.
const STEP_COPY: Record<string, string> = {
  queued: "Queued — starting your scan…",
  scraping: "Reading your site…",
  analyzing: "Scanning your market…",
  building_report: "Checking the page-one field…",
  complete: "Pricing the gap…",
}

// Reveal pacing — ~8s total from real payload values before we navigate.
const STAGGER_MS = 350
const RISK_SETTLE_MS = 1600

export function AuditLoadingScreen({ auditId }: { auditId: string }) {
  const router = useRouter()
  const [status, setStatus] = useState<AuditStatus>("processing")
  const [errorMessage, setErrorMessage] = useState("")
  const [domain, setDomain] = useState<string | null>(null)

  // Bridge between the parent's polling logic and ScanTheater's push fn.
  const pushRef = useRef<((event: ScanEvent) => void) | null>(null)
  const queueRef = useRef<ScanEvent[]>([])
  const lastStepRef = useRef<string>("")
  const revealStartedRef = useRef(false)
  const timersRef = useRef<number[]>([])
  const navigatedRef = useRef(false)

  const emit = useCallback((event: ScanEvent) => {
    if (pushRef.current) pushRef.current(event)
    else queueRef.current.push(event)
  }, [])

  // Stable subscribe — identity must not change or ScanTheater re-inits.
  const subscribe = useCallback((push: (event: ScanEvent) => void) => {
    pushRef.current = push
    if (queueRef.current.length) {
      queueRef.current.forEach((event) => push(event))
      queueRef.current = []
    }
    return () => {
      pushRef.current = null
    }
  }, [])

  const goToCapture = useCallback(() => {
    if (navigatedRef.current) return
    navigatedRef.current = true
    router.push(`/audit/capture/${auditId}`)
  }, [auditId, router])

  // Stage the reveal from REAL payload values only, then push done.
  const runReveal = useCallback(
    (audit: Audit) => {
      if (revealStartedRef.current) return
      revealStartedRef.current = true

      const analysis = audit.analysis
      const seo = analysis?.seo_report

      const keywords = (seo?.gapKeywords ?? [])
        .map((gap) => gap.keyword)
        .filter((keyword): keyword is string => Boolean(keyword && keyword.trim()))
        .slice(0, 8)

      const competitorSource = audit.competitors?.length ? audit.competitors : analysis?.competitors ?? []
      const competitors = competitorSource
        .map((competitor) => competitor?.name)
        .filter((name): name is string => Boolean(name && name.trim()))
        .slice(0, 6)

      const revenueAtRisk = (seo as unknown as { revenueAtRiskMonthly?: number } | undefined)
        ?.revenueAtRiskMonthly

      let delay = 250
      const at = (fn: () => void, ms: number) => {
        const id = window.setTimeout(fn, ms)
        timersRef.current.push(id)
      }

      keywords.forEach((label) => {
        at(() => emit({ type: "keyword", label }), delay)
        delay += STAGGER_MS
      })

      competitors.forEach((label) => {
        at(() => emit({ type: "competitor", label }), delay)
        delay += STAGGER_MS
      })

      // Real revenue only. If the payload has no figure, the risk card never renders.
      if (typeof revenueAtRisk === "number" && revenueAtRisk > 0) {
        at(
          () =>
            emit({
              type: "risk",
              monthlyUsd: revenueAtRisk,
              label: "estimated · category benchmarks",
            }),
          delay,
        )
        delay += RISK_SETTLE_MS
      }

      at(() => emit({ type: "done" }), delay + 200)
    },
    [emit],
  )

  // Fetch the domain once so the globe centers on the real site.
  useEffect(() => {
    let cancelled = false
    async function loadDomain() {
      try {
        const response = await fetch(`/api/audit/${auditId}`, { cache: "no-store" })
        const data = await response.json()
        if (!cancelled && response.ok && data?.audit?.url) {
          setDomain(getDomain(data.audit.url))
          return
        }
      } catch {
        // fall through to generic label
      }
      if (!cancelled) setDomain("your site")
    }
    loadDomain()
    return () => {
      cancelled = true
    }
  }, [auditId])

  // Poll status; emit honest status copy on each step change.
  useEffect(() => {
    let cancelled = false

    async function pollStatus() {
      try {
        const response = await fetch(`/api/audit/status/${auditId}`, { cache: "no-store" })
        const data = await response.json()

        if (cancelled) return

        if (!response.ok) {
          setStatus("failed")
          setErrorMessage(data?.error || "")
          return
        }

        const nextStatus: AuditStatus = data.status
        const step: string = data.current_step || ""

        if (step && step !== lastStepRef.current && STEP_COPY[step]) {
          lastStepRef.current = step
          emit({ type: "status", text: STEP_COPY[step] })
        }

        setStatus(nextStatus)
        setErrorMessage(data.error_message || "")
      } catch {
        if (!cancelled) setStatus("failed")
      }
    }

    pollStatus()
    const interval = window.setInterval(pollStatus, 3000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [auditId, emit])

  // On completion, fetch the full payload and stage the reveal. If that
  // fetch fails, fall back to the previous behavior (straight to capture).
  useEffect(() => {
    if (status !== "complete") return
    let cancelled = false

    async function loadAndReveal() {
      try {
        const response = await fetch(`/api/audit/${auditId}`, { cache: "no-store" })
        const data = await response.json()
        if (cancelled) return
        if (response.ok && data?.audit) {
          runReveal(data.audit as Audit)
          return
        }
      } catch {
        // fall through
      }
      if (!cancelled) goToCapture()
    }

    loadAndReveal()
    return () => {
      cancelled = true
    }
  }, [status, auditId, runReveal, goToCapture])

  // Clear reveal timers on unmount.
  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  if (status === "failed") {
    return (
      <main
        className="flex min-h-[100svh] flex-col items-center justify-center bg-[#0e0e0e] px-6 py-12 text-[#e8e8e8]"
        style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
      >
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <h1
            className="text-4xl font-normal tracking-tight text-[#f5f5f5] md:text-5xl"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            Something went wrong analyzing that URL.
          </h1>
          <p className="mt-4 max-w-md text-sm text-[#8a8a8a]">{errorMessage || "Try a different one."}</p>
          <a
            href="/#audit"
            className="mt-8 inline-flex min-h-12 items-center justify-center bg-[#FF6B35] px-6 text-xs uppercase tracking-widest text-[#0e0e0e] transition-opacity duration-200 hover:opacity-90"
          >
            Back to audit
          </a>
        </div>
      </main>
    )
  }

  return (
    <main
      className="flex min-h-[100svh] flex-col items-center justify-center bg-[#0a0a0a] px-4 py-10 text-[#e8e8e8]"
      style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
    >
      <div className="w-full max-w-4xl">
        <div className="mb-6 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#FF6B35]">GTM audit running</p>
          <h1
            className="mt-3 text-3xl font-normal tracking-tight text-[#f5f5f5] md:text-4xl"
            style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
          >
            Building your report
          </h1>
        </div>
        {domain ? (
          <ScanTheater domain={domain} subscribe={subscribe} onDone={goToCapture} />
        ) : (
          <div className="h-[560px] w-full animate-pulse rounded-2xl border border-white/10 bg-white/[0.02]" />
        )}
      </div>
    </main>
  )
}
