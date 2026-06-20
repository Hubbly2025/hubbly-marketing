"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

const steps = [
  "Analyzing your website and product...",
  "Identifying your ideal buyer profile...",
  "Scanning your competitor landscape...",
  "Querying 498M buyer intent records...",
  "Building your GTM strategy...",
  "Writing your personalized outreach...",
  "Your report is ready.",
]

type AuditStatus = "processing" | "complete" | "failed"

export function AuditLoadingScreen({ auditId }: { auditId: string }) {
  const router = useRouter()
  const [visibleSteps, setVisibleSteps] = useState(1)
  const [animationDone, setAnimationDone] = useState(false)
  const [status, setStatus] = useState<AuditStatus>("processing")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [serverStep, setServerStep] = useState("")
  const [serverProgress, setServerProgress] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const timers = steps.map((_, index) =>
      window.setTimeout(() => {
        setVisibleSteps(index + 1)
        if (index === steps.length - 1) {
          setAnimationDone(true)
        }
      }, index * 4000),
    )

    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function pollStatus() {
      try {
        const response = await fetch(`/api/audit/status/${auditId}`, { cache: "no-store" })
        const data = await response.json()

        if (!cancelled && response.ok) {
          setStatus(data.status)
          setServerStep(data.current_step || "")
          setServerProgress(typeof data.progress_percent === "number" ? data.progress_percent : null)
          setErrorMessage(data.error_message || "")
        }

        if (!cancelled && !response.ok) {
          setStatus("failed")
        }
      } catch {
        if (!cancelled) {
          setStatus("failed")
        }
      }
    }

    pollStatus()
    const interval = window.setInterval(pollStatus, 3000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [auditId])

  useEffect(() => {
    if (animationDone && status === "complete") {
      router.push(`/audit/capture/${auditId}`)
    }
  }, [animationDone, auditId, router, status])

  if (status === "failed") {
    return (
      <main className="min-h-screen bg-[#0A0A0A] px-6 py-12 text-foreground">
        <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-2xl flex-col items-center justify-center text-center">
          <HubblyLogo />
          <h1 className="mt-12 font-[var(--font-bebas)] text-4xl tracking-tight md:text-6xl">
            Something went wrong analyzing that URL.
          </h1>
          <p className="mt-4 max-w-md font-mono text-sm text-muted-foreground">
            {errorMessage || "Try a different one."}
          </p>
          <a
            href="/#close"
            className="mt-8 inline-flex min-h-12 items-center justify-center bg-accent px-6 font-mono text-xs uppercase tracking-widest text-background transition-colors duration-200 hover:bg-accent/90"
          >
            Back to audit
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-12 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-3xl flex-col items-center justify-center">
        <HubblyLogo />

        <div className="mt-16 w-full border border-border/40 bg-card/20 p-6 md:p-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
            GTM audit running
          </p>
          <h1 className="mt-4 font-[var(--font-bebas)] text-4xl tracking-tight md:text-6xl">
            Building your report
          </h1>

          <div className="mt-10 space-y-4">
            {steps.slice(0, visibleSteps).map((step, index) => (
              <div
                key={step}
                className="flex items-start gap-3 opacity-0 animate-in fade-in slide-in-from-bottom-1 duration-500"
                style={{ animationDelay: index === visibleSteps - 1 ? "0ms" : "0ms" }}
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-accent text-accent">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17L4 12" />
                  </svg>
                </span>
                <span className="font-mono text-sm text-foreground md:text-base">{step}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 h-px w-full bg-border/40">
            <div
              className="h-px bg-accent transition-all duration-700"
              style={{ width: `${Math.min((visibleSteps / steps.length) * 100, 100)}%` }}
            />
          </div>

          {animationDone && status === "processing" ? (
            <p className="mt-6 font-mono text-xs text-muted-foreground">
              This is taking a bit longer than usual. Almost there.
            </p>
          ) : null}
          {serverStep ? (
            <p className="mt-4 font-mono text-xs text-muted-foreground">
              Current step: {serverStep.replace(/_/g, " ")}
              {serverProgress !== null ? ` · ${serverProgress}%` : ""}
            </p>
          ) : null}
          {elapsedSeconds > 0 ? (
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
              {elapsedSeconds}s elapsed
            </p>
          ) : null}
        </div>
      </div>
    </main>
  )
}

function HubblyLogo() {
  return (
    <a href="/" className="group inline-flex items-center gap-3" aria-label="Hubbly home">
      <span className="flex h-9 w-9 items-center justify-center border border-accent text-accent transition-colors duration-200 group-hover:bg-accent group-hover:text-background">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" />
          <path d="M8.5 9.5L12 7.5L15.5 9.5V14.5L12 16.5L8.5 14.5V9.5Z" />
        </svg>
      </span>
      <span className="font-mono text-xs uppercase tracking-[0.3em] text-foreground">
        Hubbly<span className="text-accent">.io</span>
      </span>
    </a>
  )
}
