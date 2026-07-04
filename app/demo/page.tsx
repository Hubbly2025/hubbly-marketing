import type { Metadata } from "next"
import Link from "next/link"
import { CalEmbed } from "./cal-embed"

const CALENDAR_URL = "https://cal.com/vince-rabiola-llvenn/hubbly.io-growth-demo"

export const metadata: Metadata = {
  title: "Book your strategy call",
  description:
    "A 20-minute strategy call with Hubbly. We walk through your report, map the machine onto your business, and you leave with the plan whether you buy or not.",
  alternates: { canonical: "https://hubbly.io/demo" },
}

const sessionItems = [
  {
    title: "Your report, walked through",
    description: "We go through your audit line by line — the measured gaps, the competitors capturing them, and what each number means.",
  },
  {
    title: "The machine, mapped onto you",
    description: "Recover, Target, Capture, Convert — which stages switch on first for your business and in what order.",
  },
  {
    title: "The rollout plan",
    description: "Leave with the first pages, the ICP, and the launch sequence Hubbly would run. The plan is yours whether you buy or not.",
  },
  {
    title: "Activation, not negotiation",
    description: "No sales gate — Hubbly is self-serve when you're ready. The call is for getting you live, not for haggling.",
  },
]

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-foreground">
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-10 md:py-12">
        <header className="flex flex-col gap-8 border-b border-accent/50 pb-8 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="inline-flex items-center gap-3" aria-label="Hubbly home">
            <span className="flex h-9 w-9 items-center justify-center border border-accent text-accent">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" />
                <path d="M8.5 9.5L12 7.5L15.5 9.5V14.5L12 16.5L8.5 14.5V9.5Z" />
              </svg>
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-foreground">
              Hubbly<span className="text-accent">.io</span>
            </span>
          </Link>

          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
            Strategy call · 20 minutes
          </p>
        </header>

        <section className="grid gap-10 py-12 md:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
              Book your strategy call
            </p>
            <h1 className="mt-5 font-[var(--font-bebas)] text-5xl leading-none tracking-tight md:text-7xl">
              20 minutes. Your numbers. The plan.
            </h1>
            <p className="mt-5 max-w-xl font-mono text-sm leading-7 text-muted-foreground">
              We walk through your report, map the Recover → Target → Capture → Convert machine onto your business, and you leave with the rollout plan — whether you buy or not. It&apos;s self-serve when you&apos;re ready; the call is for activation, not negotiation.
            </p>

            <div className="mt-8 grid gap-4">
              {sessionItems.map((item) => (
                <div key={item.title} className="border border-border/50 bg-card/30 p-5">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center border border-accent text-[11px] text-accent">
                      ✓
                    </span>
                    <div>
                      <h2 className="font-mono text-sm text-foreground">{item.title}</h2>
                      <p className="mt-2 font-mono text-xs leading-6 text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-start gap-4 border border-accent/40 bg-card/30 p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
                Your Hubbly plan
              </p>
              <p className="text-pretty font-[var(--font-bebas)] text-2xl leading-[1.05] tracking-tight text-foreground md:text-3xl">
                Built from everything this audit found — your keywords, your competitors, your revenue at risk.
              </p>
              <a
                href="#book"
                className="inline-flex min-h-12 items-center justify-center bg-accent px-8 font-mono text-xs uppercase tracking-widest text-[#0A0A0A] transition-opacity duration-200 hover:opacity-90"
              >
                See your plan →
              </a>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                15-minute walkthrough · no commitment
              </p>
            </div>

            <p className="mt-8 font-mono text-xs leading-6 text-muted-foreground">
              Questions before booking? Email{" "}
              <a href="mailto:vince@hubbly.io" className="text-accent hover:text-accent/80">
                vince@hubbly.io
              </a>
              .
            </p>
          </div>

          <div id="book" className="min-h-[700px] scroll-mt-8 border border-border/50 bg-card/30 p-3 md:p-4">
            <CalEmbed />
            <div className="border-t border-border/40 px-2 py-4 text-center">
              <a
                href={CALENDAR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs uppercase tracking-widest text-accent hover:text-accent/80"
              >
                Open booking page in a new tab →
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
