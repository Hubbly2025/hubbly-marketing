import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "The Hubbly Platform — 8 AI Agents, One Memory",
  description: "Inside Hubbly: 8 coordinated AI agents that research, enrich, email, call, and book — sharing one memory with zero handoff loss.",
  alternates: { canonical: "https://hubbly.io/platform" },
}

const intelligenceAgents = [
  { name: "Recon", description: "Analyzes your website, offer, market position, and competitive landscape" },
  { name: "Competitor", description: "Maps competitor positioning, pricing, and messaging patterns" },
  { name: "ICP", description: "Builds ideal customer profiles from your best-fit buyer signals" },
  { name: "GTM Strategy", description: "Generates targeting logic, channel mix, and sequencing approach" },
  { name: "Creative", description: "Writes copy variants, subject lines, and call scripts" },
]

const executionAgents = [
  { name: "Discover", description: "Finds buyers matching your ICP from 498M+ intent-qualified records" },
  { name: "Score", description: "Ranks prospects by purchase intent and fit before outreach" },
  { name: "Write", description: "Generates personalized email and voice scripts for each contact" },
  { name: "Send", description: "Deploys sequences across email with smart timing and throttling" },
  { name: "Call", description: "Places AI voice calls with natural conversation handling" },
  { name: "Listen", description: "Monitors replies, scores sentiment, and routes responses" },
  { name: "Book", description: "Converts positive replies into scheduled calendar meetings" },
  { name: "Sync", description: "Pushes activity, leads, and outcomes to your CRM in real-time" },
]

export default function PlatformPage() {
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

        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent block mb-4">
          Platform
        </span>
        
        <h1 className="font-[var(--font-bebas)] text-4xl md:text-6xl lg:text-7xl tracking-tight mb-6">
          13 AI agents. One shared memory. Zero manual handoffs.
        </h1>
        
        <p className="font-mono text-sm md:text-base text-muted-foreground mb-16 max-w-3xl leading-relaxed">
          Hubbly runs on a coordinated system of AI agents that share context, execute in sequence, and learn from every interaction. Five agents handle intelligence. Eight agents handle execution. Human oversight gates every critical decision.
        </p>

        {/* Intelligence Agents */}
        <section className="mb-16">
          <h2 className="font-[var(--font-bebas)] text-2xl md:text-4xl tracking-tight mb-2 text-accent">
            Intelligence Layer
          </h2>
          <p className="font-mono text-sm text-muted-foreground mb-8">
            5 agents that research, analyze, and plan before any outreach begins.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {intelligenceAgents.map((agent) => (
              <div key={agent.name} className="border border-border/50 bg-card/30 p-5">
                <h3 className="font-mono text-sm uppercase tracking-widest text-foreground mb-2">{agent.name}</h3>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed">{agent.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Execution Agents */}
        <section className="mb-16">
          <h2 className="font-[var(--font-bebas)] text-2xl md:text-4xl tracking-tight mb-2 text-accent">
            Execution Layer
          </h2>
          <p className="font-mono text-sm text-muted-foreground mb-8">
            8 agents that find, reach, engage, and convert qualified buyers.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {executionAgents.map((agent) => (
              <div key={agent.name} className="border border-border/50 bg-card/30 p-5">
                <h3 className="font-mono text-sm uppercase tracking-widest text-foreground mb-2">{agent.name}</h3>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed">{agent.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Shared Memory */}
        <section className="mb-16 border-l-2 border-accent pl-6">
          <h2 className="font-[var(--font-bebas)] text-2xl md:text-3xl tracking-tight mb-4">
            Shared Memory Architecture
          </h2>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Every agent reads and writes to the same live context. Research informs targeting. Targeting informs copy. Copy informs calls. Calls inform booking. Nothing gets lost between steps because there are no handoffs between disconnected tools.
          </p>
        </section>

        {/* Human Oversight */}
        <section className="mb-16 border-l-2 border-accent pl-6">
          <h2 className="font-[var(--font-bebas)] text-2xl md:text-3xl tracking-tight mb-4">
            Human Oversight Gates
          </h2>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed max-w-2xl mb-4">
            Hubbly includes 5 approval gates where humans review and approve before the system proceeds:
          </p>
          <ul className="font-mono text-sm text-muted-foreground space-y-2">
            <li>1. Research and ICP approval</li>
            <li>2. GTM strategy and targeting approval</li>
            <li>3. Creative and copy approval</li>
            <li>4. Lead list approval</li>
            <li>5. Campaign launch approval</li>
          </ul>
        </section>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-border/30">
          <a
            href="/#close"
            className="inline-flex items-center justify-center gap-2 bg-accent px-6 py-4 font-mono text-xs uppercase tracking-widest text-background hover:bg-accent/90 transition-all duration-200"
          >
            Run My Audit
          </a>
          <a
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 border border-border/50 px-6 py-4 font-mono text-xs uppercase tracking-widest text-foreground hover:bg-card/50 transition-all duration-200"
          >
            View Pricing
          </a>
        </div>
      </div>
    </main>
  )
}
