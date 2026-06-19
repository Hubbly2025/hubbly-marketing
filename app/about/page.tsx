import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "About Hubbly — The Autonomous Revenue OS",
  description:
    "Why we built Hubbly: one autonomous revenue operating system that replaces a fragmented stack of point tools with 12 AI agents and shared memory.",
  alternates: { canonical: "https://hubbly.io/about" },
}

const values = [
  {
    title: "Autonomy with oversight",
    description:
      "The system does the work, but humans approve every critical decision. No black boxes, no rogue automation.",
  },
  {
    title: "One memory, no handoffs",
    description:
      "Every agent shares the same live context. Research informs targeting, targeting informs copy, copy informs calls.",
  },
  {
    title: "Outcomes over activity",
    description:
      "We don't measure emails sent. We measure meetings booked and pipeline created. Activity is not progress.",
  },
  {
    title: "Replace the stack",
    description:
      "We're not another point tool. Hubbly replaces the disconnected mess of data, outreach, and dialer products.",
  },
]

const milestones = [
  { year: "2024", event: "Hubbly founded in Austin, Texas with a simple thesis: GTM should run itself." },
  { year: "2025", event: "Built the 12-agent architecture across Understand, Execute, and Improve layers." },
  { year: "2026", event: "Opened private beta of the Autonomous Revenue OS to early growth teams." },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 md:py-32">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-12"
        >
          ← Back to Home
        </Link>

        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent block mb-4">About</span>

        <h1 className="font-[var(--font-bebas)] text-4xl md:text-6xl lg:text-7xl tracking-tight mb-6 text-balance">
          We built the revenue engine we always wanted.
        </h1>

        <p className="font-mono text-sm md:text-base text-muted-foreground mb-16 max-w-3xl leading-relaxed">
          Growth teams drown in tools. A platform for data, another for sequences, another for dialing, another for
          enrichment — none of them talk to each other, and a human stitches the gaps together by hand. Hubbly exists to
          end that. One autonomous revenue operating system that understands your business, executes the go-to-market
          motion, and improves itself over time.
        </p>

        {/* Mission */}
        <section className="mb-16 border-l-2 border-accent pl-6">
          <h2 className="font-[var(--font-bebas)] text-2xl md:text-3xl tracking-tight mb-4">Our mission</h2>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Make autonomous revenue accessible to every growth team — not just the ones with a fully staffed RevOps
            department and a six-figure tooling budget. If you have a website and an offer, Hubbly should be able to turn
            it into pipeline.
          </p>
        </section>

        {/* Values */}
        <section className="mb-16">
          <h2 className="font-[var(--font-bebas)] text-2xl md:text-4xl tracking-tight mb-8">What we believe</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {values.map((value) => (
              <div key={value.title} className="border border-border/40 bg-card/30 p-6">
                <h3 className="font-mono text-sm uppercase tracking-widest text-accent mb-3">{value.title}</h3>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section className="mb-16">
          <h2 className="font-[var(--font-bebas)] text-2xl md:text-4xl tracking-tight mb-8">Where we are</h2>
          <div className="space-y-4">
            {milestones.map((milestone) => (
              <div key={milestone.year} className="flex flex-col sm:flex-row gap-2 sm:gap-8 border-b border-border/20 pb-4">
                <span className="font-[var(--font-bebas)] text-2xl tracking-tight text-accent shrink-0 w-20">
                  {milestone.year}
                </span>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed">{milestone.event}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-border/30">
          <a
            href="/#audit"
            className="inline-flex items-center justify-center gap-2 bg-accent px-6 py-4 font-mono text-xs uppercase tracking-widest text-background hover:bg-accent/90 transition-all duration-200"
          >
            Run Free Audit
          </a>
          <a
            href="/waitlist"
            className="inline-flex items-center justify-center gap-2 border border-border/50 px-6 py-4 font-mono text-xs uppercase tracking-widest text-foreground hover:bg-card/50 transition-all duration-200"
          >
            Join Waitlist & Get 30 Days Free
          </a>
        </div>
      </div>
    </main>
  )
}
