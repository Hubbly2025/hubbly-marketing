"use client"

import type React from "react"
import { useState } from "react"

type Props = {
  eyebrow?: string
  headline: React.ReactNode
  subhead?: string
  fine?: string
  id?: string
}

export default function AuditCtaAdapted({
  eyebrow = "Your turn",
  headline,
  subhead,
  fine = "Free · no credit card · nothing from your session was stored",
  id = "audit-adapted",
}: Props) {
  const [url, setUrl] = useState("")

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    window.location.href = `/?audit=${encodeURIComponent(url.trim())}#audit`
  }

  return (
    <section id={id} className="border-t border-border bg-card text-center py-24">
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">{eyebrow}</span>
        <h2 className="mt-4 font-[var(--font-bebas)] text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-balance">
          {headline}
        </h2>
        {subhead && (
          <p className="mx-auto mt-4 max-w-[520px] leading-relaxed text-muted-foreground">{subhead}</p>
        )}
        <form onSubmit={onSubmit} className="mx-auto mt-9 flex max-w-[520px] flex-col gap-2.5 sm:flex-row">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="yourcompany.com"
            aria-label="Your website URL"
            autoComplete="off"
            className="flex-1 border border-border bg-background px-5 py-4 font-mono text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-accent focus:shadow-[0_0_0_1px_var(--accent)]"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 bg-accent px-7 py-4 font-mono text-xs uppercase tracking-widest text-background transition-opacity hover:opacity-90 min-h-[52px]"
          >
            Run free audit
          </button>
        </form>
        <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">{fine}</p>
      </div>
    </section>
  )
}
