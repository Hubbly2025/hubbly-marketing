"use client"

import { useRef, useEffect, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { submitAuditLead } from "@/app/actions/audit-lead"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

const URL_REGEX = /^(https?:\/\/)?([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(\/\S*)?$/i
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type FormStatus = "idle" | "submitting" | "success" | "error"

export function FinalCloseSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState("")
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<FormStatus>("idle")
  const [errors, setErrors] = useState<{ url?: string; email?: string; form?: string }>({})
  const [submitted, setSubmitted] = useState<{ domain: string; email: string } | null>(null)

  const cleanDomain = (value: string) => {
    const trimmed = value.trim()
    try {
      const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
      return new URL(withProtocol).hostname.replace(/^www\./, "")
    } catch {
      return trimmed.replace(/^https?:\/\//i, "").replace(/^www\./, "").split("/")[0]
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const nextErrors: { url?: string; email?: string } = {}
    if (!URL_REGEX.test(url.trim())) {
      nextErrors.url = "Enter a valid website (e.g. yourcompany.com)"
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      nextErrors.email = "Enter a valid work email"
    }
    if (nextErrors.url || nextErrors.email) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setStatus("submitting")

    // Simulate processing so the loading state is visible (~1.5s).
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const formData = new FormData()
    formData.set("url", url.trim())
    formData.set("email", email.trim())

    const result = await submitAuditLead(formData)

    if (result.ok) {
      setSubmitted({ domain: cleanDomain(url), email: email.trim() })
      setStatus("success")
    } else {
      setErrors({ form: result.error })
      setStatus("error")
    }
  }

  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      if (contentRef.current) {
        gsap.from(contentRef.current, {
          y: 60,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: contentRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    const params = new URLSearchParams(window.location.search)
    const source = params.get("utm_source") || params.get("ref")
    let detectedUrl = ""

    if (source) {
      detectedUrl = normalizeDetectedDomain(source)
    }

    if (!detectedUrl) {
      const referrer = document.referrer
      if (referrer && !referrer.includes("hubbly.io")) {
        try {
          detectedUrl = new URL(referrer).hostname.replace(/^www\./, "")
        } catch {}
      }
    }

    if (detectedUrl) {
      setUrl(detectedUrl)
    }
  }, [])

  // Focus the URL input whenever a "Run Free Audit" link targets #audit.
  useEffect(() => {
    const focusInput = () => {
      if (window.location.hash === "#audit") {
        // Wait for the native smooth-scroll to settle before focusing.
        window.setTimeout(() => inputRef.current?.focus(), 600)
      }
    }
    focusInput()
    window.addEventListener("hashchange", focusInput)
    return () => window.removeEventListener("hashchange", focusInput)
  }, [])

  return (
    <section ref={sectionRef} id="audit" className="relative py-24 md:py-40 px-4 md:pl-28 md:pr-12 border-t border-border/30 bg-card/20">
      <div ref={contentRef} className="max-w-4xl mx-auto text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-4 md:mb-8 block">14 / RUN IT</span>
        
        <h2 className="font-[var(--font-bebas)] text-3xl md:text-6xl lg:text-7xl tracking-tight mb-4 md:mb-8 text-balance">
          Start your free revenue audit.
        </h2>

        <p className="max-w-xl mx-auto font-mono text-xs md:text-sm text-muted-foreground mb-8 md:mb-12">
          Drop your website in and see what Hubbly would build — your ICP, competitors, campaign opportunities, and pipeline gaps.
        </p>

        {submitted ? (
          /* Success confirmation — replaces the form */
          <div className="max-w-2xl mx-auto mb-12 md:mb-16 border border-accent/40 bg-accent/5 px-6 py-10 md:px-10 md:py-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-6 border border-accent/50 text-accent">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h3 className="font-[var(--font-bebas)] text-3xl md:text-4xl tracking-tight mb-4 text-accent">
              {"You're in the queue."}
            </h3>
            <p className="max-w-md mx-auto font-mono text-xs md:text-sm text-muted-foreground leading-relaxed">
              {"We're analyzing "}
              <span className="text-foreground">{submitted.domain}</span>
              {" — your ICP, competitors, and pipeline gaps. We'll email your full audit to "}
              <span className="text-foreground">{submitted.email}</span>
              {" shortly."}
            </p>
          </div>
        ) : (
          <>
            {/* URL + Email Input Form */}
            <form
              onSubmit={handleSubmit}
              noValidate
              aria-label="Run a free revenue audit"
              className="flex flex-col items-stretch justify-center gap-3 mb-5 md:mb-6 max-w-2xl mx-auto"
            >
              <div className="flex flex-col sm:flex-row items-start justify-center gap-3">
                <div className="relative flex-1 w-full">
                  <label htmlFor="audit-url" className="sr-only">
                    Your website URL
                  </label>
                  <input
                    ref={inputRef}
                    id="audit-url"
                    name="url"
                    type="text"
                    inputMode="url"
                    autoComplete="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="yourcompany.com"
                    disabled={status === "submitting"}
                    aria-invalid={!!errors.url}
                    aria-describedby={errors.url ? "audit-url-error" : undefined}
                    className="w-full bg-background border border-border/50 px-4 md:px-5 py-4 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-200 min-h-[52px] disabled:opacity-60 aria-[invalid=true]:border-accent"
                  />
                  {errors.url && (
                    <p id="audit-url-error" className="mt-2 text-left font-mono text-[11px] text-accent">
                      {errors.url}
                    </p>
                  )}
                </div>
                <div className="relative flex-1 w-full">
                  <label htmlFor="audit-email" className="sr-only">
                    Work email
                  </label>
                  <input
                    id="audit-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    disabled={status === "submitting"}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "audit-email-error" : undefined}
                    className="w-full bg-background border border-border/50 px-4 md:px-5 py-4 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-200 min-h-[52px] disabled:opacity-60 aria-[invalid=true]:border-accent"
                  />
                  {errors.email && (
                    <p id="audit-email-error" className="mt-2 text-left font-mono text-[11px] text-accent">
                      {errors.email}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-accent px-6 md:px-8 py-4 font-mono text-xs uppercase tracking-widest text-background hover:bg-accent/90 transition-all duration-200 whitespace-nowrap min-h-[52px] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {status === "submitting" ? (
                    "Analyzing..."
                  ) : (
                    <>
                      Run Free Audit
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M7 17L17 7M17 7H7M17 7V17" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
              <p className="text-left font-mono text-[11px] text-muted-foreground">
                {"We'll analyze your site, your competitors, and your active buyers."}
              </p>
              {errors.form && (
                <p role="alert" className="text-left font-mono text-[11px] text-accent">
                  {errors.form}
                </p>
              )}
            </form>

            {/* Trust cues */}
            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-12 md:mb-16 font-mono text-[11px] uppercase tracking-widest text-muted-foreground/80">
              {["No credit card required", "Results in ~60 seconds", "Private & secure"].map((cue) => (
                <li key={cue} className="inline-flex items-center gap-2">
                  <svg className="w-3 h-3 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  {cue}
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Secondary Action */}
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 mb-12 md:mb-20">
          <span className="font-mono text-xs text-muted-foreground">or</span>
          <a
            href="/#how-it-works"
            className="font-mono text-xs uppercase tracking-widest text-foreground hover:text-accent transition-colors duration-200 py-2"
          >
            SEE THE SYSTEM
          </a>
        </div>

        {/* Bottom tagline */}
        <p className="font-mono text-xs md:text-sm text-muted-foreground/60 mb-4">
          From website to pipeline. In one autonomous revenue OS.
        </p>
        <p className="font-mono text-lg md:text-xl tracking-[0.3em] text-muted-foreground/30 uppercase">
          THE OPERATING SYSTEM FOR REVENUE
        </p>
      </div>
    </section>
  )
}

function normalizeDetectedDomain(value: string) {
  const trimmed = value.trim()

  if (!trimmed) return ""

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    return new URL(withProtocol).hostname.replace(/^www\./, "")
  } catch {
    return trimmed.replace(/^www\./, "")
  }
}
