import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "The Hubbly Platform — 12 AI Agents, 3 Layers, One Memory",
  description: "Inside Hubbly: 12 specialized revenue agents organized in 3 layers (Understand, Execute, Improve) sharing one operating memory with zero handoff loss.",
  alternates: { canonical: "https://hubbly.io/platform" },
}

const understandAgents = [
  { name: "Recon", description: "Analyzes the website, market, competitors, SEO, CRO, and AI visibility" },
  { name: "ICP", description: "Defines ideal customers, segments, buying triggers, and target accounts" },
  { name: "Strategy", description: "Turns business intelligence into GTM direction, offers, channels, and campaign plans" },
]

const executeAgents = [
  { name: "Scout", description: "Finds and enriches accounts and leads from 498M+ intent-qualified records" },
  { name: "Score", description: "Ranks opportunities by fit, intent, urgency, and conversion potential" },
  { name: "Writer", description: "Creates emails, ads, landing copy, scripts, and sales messaging" },
  { name: "Sender", description: "Launches and manages outbound sequences across email" },
  { name: "Voice", description: "Places AI calls, qualifies prospects, and captures call outcomes" },
  { name: "Booker", description: "Schedules meetings and routes qualified opportunities" },
]

const improveAgents = [
  { name: "Track", description: "Monitors campaigns, funnel movement, CRM activity, and pipeline performance" },
  { name: "Optimize", description: "Identifies what is working, what is failing, and what should change" },
  { name: "Advisor", description: "Produces prioritized recommendations and feeds improvements back into the system" },
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
          12 AI agents. 3 layers. One shared memory.
        </h1>
        
        <p className="font-mono text-sm md:text-base text-muted-foreground mb-16 max-w-3xl leading-relaxed">
          Hubbly is one product organized into three operating layers: Understand, Execute, and Improve. Each layer uses shared memory so the system gets smarter as it works. Human oversight gates every critical decision.
        </p>

        {/* Understand Agents */}
        <section className="mb-16">
          <h2 className="font-[var(--font-bebas)] text-2xl md:text-4xl tracking-tight mb-2 text-green-500">
            01 / Understand
          </h2>
          <p className="font-mono text-sm text-muted-foreground mb-8">
            Hubbly learns the business. It analyzes your website, offer, market, ICP, competitors, SEO, CRO, and buyer-intent signals.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {understandAgents.map((agent) => (
              <div key={agent.name} className="border border-green-500/30 bg-green-500/5 p-5">
                <h3 className="font-mono text-sm uppercase tracking-widest text-green-500 mb-2">{agent.name}</h3>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed">{agent.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Execute Agents */}
        <section className="mb-16">
          <h2 className="font-[var(--font-bebas)] text-2xl md:text-4xl tracking-tight mb-2 text-accent">
            02 / Execute
          </h2>
          <p className="font-mono text-sm text-muted-foreground mb-8">
            Hubbly runs the GTM motion. It builds campaigns, finds buyers, writes outreach, sends sequences, places calls, qualifies replies, and books meetings.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {executeAgents.map((agent) => (
              <div key={agent.name} className="border border-accent/30 bg-accent/5 p-5">
                <h3 className="font-mono text-sm uppercase tracking-widest text-accent mb-2">{agent.name}</h3>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed">{agent.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Improve Agents */}
        <section className="mb-16">
          <h2 className="font-[var(--font-bebas)] text-2xl md:text-4xl tracking-tight mb-2 text-purple-500">
            03 / Improve
          </h2>
          <p className="font-mono text-sm text-muted-foreground mb-8">
            Hubbly learns from outcomes. It tracks what works, what fails, what converts, and what should change — then feeds those insights back into the agents.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {improveAgents.map((agent) => (
              <div key={agent.name} className="border border-purple-500/30 bg-purple-500/5 p-5">
                <h3 className="font-mono text-sm uppercase tracking-widest text-purple-500 mb-2">{agent.name}</h3>
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
            href="/#audit"
            className="inline-flex items-center justify-center gap-2 bg-accent px-6 py-4 font-mono text-xs uppercase tracking-widest text-background hover:bg-accent/90 transition-all duration-200"
          >
            Start Free
          </a>
          <a
            href="https://cal.com/hubbly/demo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 border border-border/50 px-6 py-4 font-mono text-xs uppercase tracking-widest text-foreground hover:bg-card/50 transition-all duration-200"
          >
            Get Pricing
          </a>
        </div>
      </div>
    </main>
  )
}
