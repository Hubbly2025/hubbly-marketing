import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Integrations — Connect Hubbly to Your Stack",
  description:
    "Hubbly connects to your CRM, calendar, email, and data sources so the autonomous revenue OS works with the tools you already use.",
  alternates: { canonical: "https://hubbly.io/integrations" },
}

const categories = [
  {
    name: "CRM & Pipeline",
    description: "Sync accounts, contacts, and opportunities both ways. Hubbly keeps your CRM the source of truth.",
    tools: ["Salesforce", "HubSpot", "Pipedrive", "Close", "Attio"],
  },
  {
    name: "Email & Outreach",
    description: "Send sequences from your own domains with full deliverability and reply detection.",
    tools: ["Gmail / Google Workspace", "Microsoft 365", "SendGrid", "Postmark"],
  },
  {
    name: "Calendar & Scheduling",
    description: "Book qualified meetings straight onto the right rep's calendar with no back-and-forth.",
    tools: ["Google Calendar", "Outlook Calendar", "Cal.com", "Calendly"],
  },
  {
    name: "Data & Enrichment",
    description: "Pull from 498M+ intent-qualified records to find and enrich the right accounts.",
    tools: ["Clearbit", "Apollo", "ZoomInfo", "Clay"],
  },
  {
    name: "Voice & Telephony",
    description: "Place AI calls, qualify prospects, and log outcomes back to the timeline automatically.",
    tools: ["Twilio", "Telnyx", "Vonage"],
  },
  {
    name: "Messaging & Alerts",
    description: "Get notified when a meeting books, a deal moves, or an approval is waiting on you.",
    tools: ["Slack", "Microsoft Teams", "Discord"],
  },
]

export default function IntegrationsPage() {
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

        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent block mb-4">Integrations</span>

        <h1 className="font-[var(--font-bebas)] text-4xl md:text-6xl lg:text-7xl tracking-tight mb-6 text-balance">
          Works with the stack you already run.
        </h1>

        <p className="font-mono text-sm md:text-base text-muted-foreground mb-16 max-w-3xl leading-relaxed">
          Hubbly is the autonomous layer on top of your existing tools. Connect your CRM, calendar, email, and data
          sources, and the agents operate inside the systems your team already trusts — no rip and replace.
        </p>

        {/* Integration categories */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          {categories.map((category) => (
            <div key={category.name} className="border border-border/40 bg-card/30 p-6">
              <h2 className="font-mono text-sm uppercase tracking-widest text-accent mb-2">{category.name}</h2>
              <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-5">{category.description}</p>
              <ul className="flex flex-wrap gap-2">
                {category.tools.map((tool) => (
                  <li
                    key={tool}
                    className="font-mono text-xs text-foreground border border-border/50 bg-background/50 px-3 py-1.5"
                  >
                    {tool}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* API note */}
        <section className="mb-16 border-l-2 border-accent pl-6">
          <h2 className="font-[var(--font-bebas)] text-2xl md:text-3xl tracking-tight mb-4">Don't see your tool?</h2>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Hubbly ships with a REST API and webhooks so you can connect anything in your stack. Custom integrations are
            available for teams in private beta — tell us what you need and we'll wire it up.
          </p>
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
            href="/contact"
            className="inline-flex items-center justify-center gap-2 border border-border/50 px-6 py-4 font-mono text-xs uppercase tracking-widest text-foreground hover:bg-card/50 transition-all duration-200"
          >
            Request an Integration
          </a>
        </div>
      </div>
    </main>
  )
}
