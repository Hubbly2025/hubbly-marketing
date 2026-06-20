import type { Persona } from "./types"
import { formatPlanValue } from "./audit-utils"

export function HubblyLogo() {
  return (
    <a href="/" className="inline-flex items-center gap-3" aria-label="Hubbly home">
      <span className="flex h-9 w-9 items-center justify-center border border-[#FF6B35] text-[#FF6B35]">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" />
          <path d="M8.5 9.5L12 7.5L15.5 9.5V14.5L12 16.5L8.5 14.5V9.5Z" />
        </svg>
      </span>
      <span className="font-mono text-xs uppercase tracking-[0.3em] text-white">
        Hubbly<span className="text-[#FF6B35]">.io</span>
      </span>
    </a>
  )
}

export function ProcessingState() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-12 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-xl flex-col items-center justify-center text-center">
        <HubblyLogo />
        <div className="mt-10 h-3 w-3 animate-pulse rounded-full bg-[#FF6B35]" />
        <h1 className="mt-6 font-[var(--font-bebas)] text-4xl tracking-tight md:text-6xl">
          Your report is almost ready...
        </h1>
      </div>
    </main>
  )
}

export function FailedState({ message }: { message?: string | null }) {
  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-12 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-xl flex-col items-center justify-center text-center">
        <HubblyLogo />
        <h1 className="mt-10 font-[var(--font-bebas)] text-4xl tracking-tight md:text-6xl">
          We couldn't analyze that site.
        </h1>
        <p className="mt-4 max-w-lg font-mono text-sm leading-6 text-white/60">
          {message || "It may block automated tools or require JavaScript. Try a different URL or enter your company details manually."}
        </p>
        <a
          href="/#close"
          className="mt-8 inline-flex min-h-12 items-center justify-center bg-[#FF6B35] px-6 font-mono text-xs uppercase tracking-widest text-[#0A0A0A] transition-colors duration-200 hover:opacity-90"
        >
          Try a different URL →
        </a>
      </div>
    </main>
  )
}

export function ReportSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="border-t border-[#FF6B35]/50 pt-6">
      <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#FF6B35]">{eyebrow}</p>
        <h2 className="font-[var(--font-bebas)] text-4xl leading-none tracking-tight text-white md:text-6xl">
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

export function CorrectionNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-5 border border-[#FF6B35]/30 bg-[#FF6B35]/[0.06] p-3 font-mono text-xs leading-6 text-[#FFB199]">
      {children}
    </p>
  )
}

export function SnapshotRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="border border-white/10 bg-white/[0.03] p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#FF6B35]">{label}</p>
      <p className="mt-3 text-sm leading-6 text-white/78">{value || "Not enough public data to determine confidently"}</p>
    </div>
  )
}

export function PersonaCard({ label, persona }: { label: string; persona?: Persona }) {
  return (
    <div className="border border-white/10 bg-white/[0.03] p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#FF6B35]">{label}</p>
      <h3 className="mt-4 text-xl font-semibold text-white">{persona?.title || "Buyer title unavailable"}</h3>
      <dl className="mt-5 space-y-4 text-sm">
        <Detail label="Company size" value={persona?.company_size} />
        <Detail label="Pain point" value={persona?.pain_point} />
        <Detail label="Trigger" value={persona?.trigger} />
      </dl>
    </div>
  )
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</dt>
      <dd className="mt-1 leading-6 text-white/72">{value || "Unavailable"}</dd>
    </div>
  )
}

export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-[#0A0A0A]/50 p-5">
      <p className="font-[var(--font-bebas)] text-5xl leading-none text-white">{value}</p>
      <p className="mt-2 font-mono text-xs uppercase tracking-[0.14em] text-white/50">{label}</p>
    </div>
  )
}

export function ChecklistItem({ complete = false, label }: { complete?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 border border-white/10 bg-white/[0.03] p-4">
      <span className={complete ? "text-emerald-400" : "text-red-400"}>{complete ? "✓" : "✗"}</span>
      <span className="text-sm text-white/76">{label}</span>
    </div>
  )
}

export function PlanColumn({ title, items }: { title: string; items?: Record<string, unknown> }) {
  return (
    <div className="border border-white/10 bg-white/[0.03] p-5">
      <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-[#FF6B35]">{title}</h3>
      <div className="mt-5 space-y-4">
        {Object.entries(items ?? {}).map(([key, value]) => (
          <div key={key}>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
              {key.replace(/_/g, " ")}
            </p>
            <p className="mt-1 text-sm leading-6 text-white/72">{formatPlanValue(value)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
