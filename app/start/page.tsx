import type { Metadata } from "next"
import Link from "next/link"
import { StartForm } from "./start-form"

export const metadata: Metadata = {
  title: "Start your 14-day Autopilot trial",
  description:
    "Self-serve signup for Hubbly Autopilot. No contract — the trial starts from your inbox.",
  alternates: { canonical: "https://hubbly.io/start" },
}

const riskReversalLines = [
  "Signup takes 30 seconds.",
  "Cancel anytime. No 6-month contract.",
  "You keep every page Autopilot publishes — they live on your domain.",
]

export default function StartPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-10 md:py-12">
        <header className="flex flex-col gap-8 border-b border-[#FF6B35]/50 pb-8 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="inline-flex items-center gap-3" aria-label="Hubbly home">
            <span className="flex h-9 w-9 items-center justify-center border border-[#FF6B35] text-[#FF6B35]">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" />
                <path d="M8.5 9.5L12 7.5L15.5 9.5V14.5L12 16.5L8.5 14.5V9.5Z" />
              </svg>
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-white">
              Hubbly<span className="text-[#FF6B35]">.io</span>
            </span>
          </Link>

          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#FF6B35]">
            Autopilot · $498/mo
          </p>
        </header>

        <section className="grid gap-10 py-12 md:py-16 lg:grid-cols-[1fr_1fr] lg:items-start">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#FF6B35]">
              Self-serve
            </p>
            <h1 className="mt-5 font-[var(--font-bebas)] text-5xl leading-none tracking-tight md:text-7xl">
              Start your 14-day Autopilot trial
            </h1>
            <div className="mt-8 space-y-3">
              {riskReversalLines.map((line) => (
                <p key={line} className="font-mono text-sm leading-6 text-white/70">
                  <span className="mr-3 text-[#FF6B35]">→</span>
                  {line}
                </p>
              ))}
            </div>
            <p className="mt-8 font-mono text-xs leading-6 text-white/45">
              Want the machine mapped onto your business first?{" "}
              <Link href="/demo" className="text-[#FF6B35] hover:text-[#FF6B35]/80">
                Book a strategy call
              </Link>{" "}
              — 20 minutes, and the price stays the same either way. Or email{" "}
              <a href="mailto:vince@hubbly.io" className="text-[#FF6B35] hover:text-[#FF6B35]/80">
                vince@hubbly.io
              </a>
              .
            </p>
          </div>

          <StartForm />
        </section>
      </div>
    </main>
  )
}
