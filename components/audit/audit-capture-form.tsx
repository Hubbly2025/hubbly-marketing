"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"

export function AuditCaptureForm({ auditId }: { auditId: string }) {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")
  const [weeklyOptin, setWeeklyOptin] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRequestingManual, setIsRequestingManual] = useState(false)
  const [error, setError] = useState("")
  const [manualQueued, setManualQueued] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/audit/submit-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audit_id: auditId,
          first_name: firstName,
          email,
          company,
          weekly_optin: weeklyOptin,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "We had trouble sending your report. Try again or request manual delivery.")
      }

      const data = await response.json().catch(() => null)
      router.push(data?.report_url || `/audit/report/${auditId}`)
    } catch (error) {
      setError(error instanceof Error ? error.message : "We had trouble sending your report. Try again or request manual delivery.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleManualRequest() {
    setError("")
    setManualQueued(false)

    if (!firstName.trim() || !email.trim()) {
      setError("Add your first name and email so we can send the audit manually.")
      return
    }

    setIsRequestingManual(true)

    try {
      const response = await fetch("/api/audit/request-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audit_id: auditId,
          first_name: firstName,
          email,
          company,
          reason: error || "Manual delivery requested from capture page",
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "We could not queue manual delivery.")
      }

      setManualQueued(true)
    } catch (manualError) {
      setError(manualError instanceof Error ? manualError.message : "We could not queue manual delivery.")
    } finally {
      setIsRequestingManual(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-12 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-xl flex-col items-center justify-center">
        <a href="/" className="mb-10 inline-flex items-center gap-3" aria-label="Hubbly home">
          <span className="flex h-9 w-9 items-center justify-center border border-accent text-accent">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" />
              <path d="M8.5 9.5L12 7.5L15.5 9.5V14.5L12 16.5L8.5 14.5V9.5Z" />
            </svg>
          </span>
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-foreground">
            Hubbly<span className="text-accent">.io</span>
          </span>
        </a>

        <section className="w-full border border-border/40 bg-card/30 p-6 md:p-10">
          <div className="text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
              Report ready
            </p>
            <h1 className="mt-4 font-[var(--font-bebas)] text-4xl tracking-tight md:text-6xl">
              Your GTM audit is ready.
            </h1>
            <p className="mt-3 font-mono text-sm text-muted-foreground">
              Where should we send it?
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="First name"
              required
              className="min-h-12 w-full border border-border/50 bg-background px-4 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Work email"
              required
              className="min-h-12 w-full border border-border/50 bg-background px-4 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />

            <input
              type="text"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="Company (optional)"
              className="min-h-12 w-full border border-border/50 bg-background px-4 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors duration-200 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />

            <label className="flex cursor-pointer items-start gap-3 border border-border/40 bg-background/60 p-4">
              <input
                type="checkbox"
                checked={weeklyOptin}
                onChange={(event) => setWeeklyOptin(event.target.checked)}
                className="mt-1 h-4 w-4 accent-[var(--accent)]"
              />
              <span className="font-mono text-xs leading-5 text-muted-foreground">
                Send me the weekly Hubbly Intel Report — buyer trends, GTM plays, and what's working in outreach.
              </span>
            </label>

            {error ? (
              <div className="border border-red-500/40 bg-red-500/10 p-4">
                <p className="font-mono text-xs leading-5 text-red-200">{error}</p>
                <button
                  type="button"
                  onClick={handleManualRequest}
                  disabled={isRequestingManual}
                  className="mt-3 inline-flex min-h-10 items-center justify-center border border-accent px-4 font-mono text-[10px] uppercase tracking-widest text-accent transition-colors duration-200 hover:bg-accent hover:text-background disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isRequestingManual ? "Queueing manual delivery..." : "Email me results instead"}
                </button>
              </div>
            ) : null}

            {manualQueued ? (
              <div className="border border-accent/40 bg-accent/10 p-4">
                <p className="font-mono text-xs leading-5 text-foreground">
                  Manual delivery is queued. We will review this audit and email the report as soon as it is ready.
                </p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-h-12 w-full items-center justify-center bg-accent px-6 font-mono text-xs uppercase tracking-widest text-background transition-colors duration-200 hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Sending your report..." : "Send My Report →"}
            </button>
          </form>

          <p className="mt-5 text-center font-mono text-[11px] leading-5 text-muted-foreground">
            We'll also show you how Hubbly OS executes this entire plan automatically. Unsubscribe anytime.
          </p>
        </section>
      </div>
    </main>
  )
}
