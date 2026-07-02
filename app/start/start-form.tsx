"use client"

import { useState } from "react"

// Posts to the existing waitlist API (app/api/waitlist/signup/route.ts —
// do not edit that route). The API requires role/company_size/pain_points/
// expected_results as non-empty strings, so the self-serve flow sends honest
// fixed values: role "self_serve" scores zero priority points — we don't
// fabricate a founder title to game the queue. The visitor's first name rides
// in pain_points so it reaches the internal notification email.
export function StartForm() {
  const [firstName, setFirstName] = useState("")
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === "submitting") return
    setStatus("submitting")
    setErrorMessage("")

    try {
      const response = await fetch("/api/waitlist/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          company: website.trim(),
          role: "self_serve",
          company_size: "self_serve_signup",
          pain_points: `Self-serve Autopilot trial signup. First name: ${firstName.trim() || "not given"}`,
          expected_results: "Start the 14-day Autopilot trial",
          timeline: "immediate",
          utm_source: "audit_report_offer",
          audit_url: website.trim(),
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setStatus("error")
        setErrorMessage(
          typeof data?.error === "string" ? data.error : "Something went wrong. Try again.",
        )
        return
      }
      setStatus("success")
    } catch {
      setStatus("error")
      setErrorMessage("Something went wrong. Try again.")
    }
  }

  if (status === "success") {
    return (
      <div className="border border-[#FF6B35]/60 bg-[#FF6B35]/[0.06] p-6 md:p-10">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#FF6B35]">
          You&apos;re in
        </p>
        <p className="mt-5 max-w-md text-xl leading-8 text-white md:text-2xl">
          You&apos;re in. Check your email — your Autopilot trial starts there.
        </p>
        <p className="mt-4 font-mono text-xs leading-6 text-white/55">
          Prefer a walkthrough first?{" "}
          <a href="/demo" className="text-[#FF6B35] hover:text-[#FF6B35]/80">
            Book a strategy call
          </a>{" "}
          anytime — the price stays the price either way.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border border-white/10 bg-white/[0.03] p-6 md:p-8">
      <div className="space-y-5">
        <Field
          label="First name"
          id="start-first-name"
          type="text"
          value={firstName}
          onChange={setFirstName}
          placeholder="Alex"
          required
          autoComplete="given-name"
        />
        <Field
          label="Work email"
          id="start-email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="alex@company.com"
          required
          autoComplete="email"
        />
        <Field
          label="Website URL"
          id="start-website"
          type="text"
          value={website}
          onChange={setWebsite}
          placeholder="company.com"
          required
          autoComplete="url"
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-7 inline-flex min-h-12 w-full items-center justify-center bg-[#FF6B35] px-6 font-mono text-xs uppercase tracking-widest text-[#0A0A0A] transition-opacity duration-200 hover:opacity-90 disabled:opacity-60"
      >
        {status === "submitting" ? "Starting…" : "Start my 14-day trial →"}
      </button>

      {status === "error" && (
        <p className="mt-4 font-mono text-xs leading-6 text-red-400" role="alert">
          {errorMessage}
        </p>
      )}

      <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
        14-day trial · Cancel anytime · The price is the price
      </p>
    </form>
  )
}

function Field({
  label,
  id,
  type,
  value,
  onChange,
  placeholder,
  required,
  autoComplete,
}: {
  label: string
  id: string
  type: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  required?: boolean
  autoComplete?: string
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/55"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className="mt-2 w-full border border-white/15 bg-[#0A0A0A] px-4 py-3 font-mono text-sm text-white placeholder:text-white/30 focus:border-[#FF6B35] focus:outline-none"
      />
    </div>
  )
}
