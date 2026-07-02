"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuditScanProgress } from "@/components/audit/audit-scan-progress"

type AuditStatus = "processing" | "complete" | "failed"

export function AuditLoadingScreen({ auditId }: { auditId: string }) {
  const router = useRouter()
  const [status, setStatus] = useState<AuditStatus>("processing")
  const [serverStep, setServerStep] = useState("")
  const [serverProgress, setServerProgress] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState("")

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
    if (status === "complete") {
      router.push(`/audit/capture/${auditId}`)
    }
  }, [auditId, router, status])

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
          <p className="mt-4 max-w-md text-sm text-[#8a8a8a]">
            {errorMessage || "Try a different one."}
          </p>
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

  const step = serverStep ? serverStep.replace(/_/g, " ") : "building report"
  const percent = serverProgress !== null ? serverProgress : 75

  return <AuditScanProgress step={step} percent={percent} />
}
