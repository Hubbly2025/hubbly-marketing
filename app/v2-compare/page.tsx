import type { Metadata } from "next"
import AuditCtaV2 from "@/components/v2/audit-cta"
import AuditCtaAdapted from "@/components/v2/audit-cta-adapted"
import "./v2-tokens.css"

export const metadata: Metadata = {
  title: "V2 Design Comparison — Hubbly",
  description: "Internal comparison of the Hubbly.ioV2 design directions.",
  robots: { index: false, follow: false },
}

const headline = (
  <>
    See what your revenue engine
    <br />
    is leaving on the table.
  </>
)

export default function V2ComparePage() {
  return (
    <main className="bg-background text-foreground">
      {/* Intro */}
      <div className="mx-auto max-w-6xl px-6 md:px-8 py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent">Internal preview</p>
        <h1 className="mt-4 font-[var(--font-bebas)] text-5xl md:text-7xl leading-none tracking-tight">
          Hubbly.ioV2 — Two Directions
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
          The same Audit CTA rendered two ways. Direction A keeps the uploaded V2 design system (rounded corners, new
          tokens, reveal animations). Direction B adapts it to the current live site (square corners, existing tokens).
          Pick one and I&apos;ll roll the rest of the V2 components to match.
        </p>
      </div>

      {/* Direction A — new system */}
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <span className="bg-accent px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-background">
            Direction A
          </span>
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            New V2 system — rounded, animated
          </span>
        </div>
      </div>
      <div className="v2scope">
        <AuditCtaV2
          headline={headline}
          subhead="Run a free 60-second audit. We analyze your funnel, messaging, and competitive position — no signup required."
        />
      </div>

      {/* Direction B — adapted */}
      <div className="mx-auto max-w-6xl px-6 md:px-8 mt-20">
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <span className="bg-foreground px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-background">
            Direction B
          </span>
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Adapted to current live site — square, on-brand
          </span>
        </div>
      </div>
      <AuditCtaAdapted
        headline={headline}
        subhead="Run a free 60-second audit. We analyze your funnel, messaging, and competitive position — no signup required."
      />

      <div className="h-24" />
    </main>
  )
}
