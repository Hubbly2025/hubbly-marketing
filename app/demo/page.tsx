import type { Metadata } from "next"
import Link from "next/link"

const CALENDAR_URL = "https://cal.com/vince-rabiola-llvenn"

export const metadata: Metadata = {
  title: "Book a Demo",
  description: "Book a revenue strategy session with Hubbly and see the autonomous revenue operating system in action.",
  alternates: { canonical: "https://hubbly.io/demo" },
}

const sessionItems = [
  {
    title: "Live product walkthrough",
    description: "See the audit, campaign approval, outreach, voice, and booking workflow in one pass.",
  },
  {
    title: "Revenue strategy review",
    description: "Map your current GTM motion, tech stack, bottlenecks, and fastest pipeline opportunities.",
  },
  {
    title: "Implementation plan",
    description: "Leave with the first campaign, ICP, message angle, and launch sequence Hubbly would run.",
  },
  {
    title: "Private beta fit",
    description: "Talk through access, timeline, and whether Hubbly is the right operating layer for your team.",
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
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-foreground">Hubbly</span>
          </Link>

          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
            Revenue strategy session
          </p>
        </header>

        <section className="grid gap-10 py-12 md:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
              Book a demo
            </p>
            <h1 className="mt-5 font-[var(--font-bebas)] text-5xl leading-none tracking-tight md:text-7xl">
              Book your revenue strategy session.
            </h1>
            <p className="mt-5 max-w-xl font-mono text-sm leading-7 text-muted-foreground">
              Get a personalized walkthrough of Hubbly's autonomous revenue platform and see how the system turns your website, ICP, competitor signals, outreach, voice, and booking into one coordinated pipeline.
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

            <p className="mt-8 font-mono text-xs leading-6 text-muted-foreground">
              Questions before booking? Email{" "}
              <a href="mailto:vince@hubbly.io" className="text-accent hover:text-accent/80">
                vince@hubbly.io
              </a>
              .
            </p>
          </div>

          <div className="border border-border/50 bg-card/30 p-3 md:p-4">
            <iframe
              src={CALENDAR_URL}
              title="Book a demo with Vince"
              className="h-[760px] w-full bg-white"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
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
