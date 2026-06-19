import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Hubbly.io V2 — Preview Hub",
  description: "Internal preview hub for Hubbly.io V2 pages.",
  robots: { index: false, follow: false },
}

type V2Link = {
  href: string
  title: string
  description: string
  tag: string
}

const NEW_PAGES: V2Link[] = [
  {
    href: "/signal",
    title: "Signal",
    description: "Live-measurement page that reads the visitor's real session in real time.",
    tag: "New design system",
  },
  {
    href: "/autopilot",
    title: "Autopilot",
    description: "Autonomous revenue-ops page with animated work queue and code-build panels.",
    tag: "New design system",
  },
  {
    href: "/v2-compare",
    title: "Direction Compare",
    description: "AuditCTA shown two ways — new V2 system vs. adapted to the current site.",
    tag: "Comparison",
  },
]

const MARKETING_PAGES: V2Link[] = [
  {
    href: "/about",
    title: "About",
    description: "Company mission, values grid, and year-by-year timeline.",
    tag: "Marketing",
  },
  {
    href: "/integrations",
    title: "Integrations",
    description: "Categorized integration groups plus an API/webhooks callout.",
    tag: "Marketing",
  },
  {
    href: "/contact",
    title: "Contact",
    description: "Working contact form wired to Resend email notifications.",
    tag: "Marketing",
  },
]

function LinkCard({ link }: { link: V2Link }) {
  return (
    <a
      href={link.href}
      className="group flex flex-col border border-border/50 bg-card/30 p-6 transition-all duration-200 hover:border-accent/60 hover:bg-card/60"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{link.tag}</span>
        <span className="font-mono text-xs text-muted-foreground transition-colors group-hover:text-accent">{link.href}</span>
      </div>
      <h2 className="mt-4 font-[var(--font-bebas)] text-3xl leading-none tracking-tight">{link.title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{link.description}</p>
      <span className="mt-5 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
        View page
        <svg className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </a>
  )
}

export default function V2HubPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <header className="border-b border-border/50 pb-10">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Internal preview</p>
          <h1 className="mt-5 font-[var(--font-bebas)] text-6xl leading-none tracking-tight md:text-8xl">
            Hubbly.io V2
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Preview hub for the new pages. These are unlinked from the live site and live on the{" "}
            <span className="font-mono text-sm text-foreground">hubbly-io-v2</span> branch, so nothing here is published until you merge.
          </p>
        </header>

        <section className="mt-14">
          <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">New design system</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {NEW_PAGES.map((link) => (
              <LinkCard key={link.href} link={link} />
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Marketing pages</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MARKETING_PAGES.map((link) => (
              <LinkCard key={link.href} link={link} />
            ))}
          </div>
        </section>

        <footer className="mt-16 border-t border-border/50 pt-8">
          <a href="/" className="font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground">
            ← Back to live site
          </a>
        </footer>
      </div>
    </main>
  )
}
