import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Hubbly Architecture — The Autonomous Growth Engine",
  description: "See how Hubbly's 12-agent revenue system uses shared memory, approval gates, and coordinated execution to turn a website into pipeline.",
  alternates: { canonical: "https://hubbly.io/architecture" },
}

const intelligenceAgents = [
  { name: "Recon", description: "Analyzes your business, offer, positioning, and website to understand what you sell and how you should be framed in-market." },
  { name: "Research", description: "Builds competitor intelligence and market context so strategy is grounded in the actual category landscape." },
  { name: "ICP", description: "Maps your best-fit buyer profile, filters low-intent prospects, and defines the accounts worth pursuing." },
  { name: "Strategy", description: "Translates business context, market inputs, and ICP logic into a go-to-market plan the system can execute." },
  { name: "Creative", description: "Produces approved campaign assets that support outbound and, on Business tier, paid acquisition workflows." },
]

const executionAgents = [
  { name: "Discover", description: "Finds buyers and accounts that match the approved ICP and targeting logic." },
  { name: "Score", description: "Ranks prospects using fit and intent signals so the system focuses on the right opportunities first." },
  { name: "Write", description: "Drafts outreach sequences and personalized messaging based on approved positioning and live signals." },
  { name: "Send", description: "Launches email campaigns and manages outbound delivery." },
  { name: "Call", description: "Places AI voice calls to high-priority leads as part of the execution flow." },
  { name: "Listen", description: "Classifies inbound replies and routes interest, objections, and outcomes back into the system." },
  { name: "Book", description: "Converts positive engagement into scheduled meetings through calendar workflows." },
]

const sharedMemoryFeatures = [
  "Preserves company, offer, market, and positioning context from the initial website analysis.",
  "Carries approved ICP and GTM logic into prospect discovery, scoring, and writing.",
  "Keeps email, voice, inbox, and booking activity connected so every agent sees the same buyer history.",
  "Feeds replies, objections, meetings, and conversion patterns back into the system to improve future execution.",
]

const humanApprovalPoints = [
  "Company and business understanding.",
  "ICP and audience definition.",
  "Go-to-market strategy.",
  "Creative and campaign assets.",
  "The transition from approved strategy into live execution.",
]

const automatedPoints = [
  "Buyer discovery and filtering.",
  "Intent-based scoring and prioritization.",
  "Outreach drafting and campaign launch.",
  "AI voice calling and reply classification.",
  "Booking workflows and activity logging.",
]

const faqs = [
  {
    question: "How does Hubbly's multi-agent system work?",
    answer: "Hubbly runs through 12 specialized revenue agents organized into 3 operating layers. Those agents share one operating memory, which lets research, targeting, messaging, outreach, voice, booking, and tracking stay coordinated across the full pipeline.",
  },
  {
    question: "What is the Shared Memory & Context Layer?",
    answer: "It is the common operating context every agent reads from and writes to. Instead of losing information between separate tools, Hubbly keeps company context, buyer logic, outreach history, reply status, and meeting outcomes connected in one system.",
  },
  {
    question: "How is Hubbly different from a chatbot or copilot?",
    answer: "A chatbot generates answers in-session, while Hubbly is built to run an approved revenue workflow end to end. It combines intelligence, execution, memory, and optimization into one operating system rather than acting as a single conversational layer on top of fragmented tools.",
  },
  {
    question: "What agents does Hubbly use?",
    answer: "Hubbly uses 12 specialized agents organized in 3 layers: Intelligence (Recon, Research, ICP, Strategy, Creative), Execution (Discover, Score, Write, Send, Call, Listen, Book), and Optimization (Track, Optimize, Advisor behaviors within the improvement loop).",
  },
]

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
}

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Hubbly Autonomous Growth Engine",
  description: "An autonomous growth engine with 12 specialized AI agents, shared memory architecture, and human-in-the-loop oversight.",
  brand: {
    "@type": "Brand",
    name: "Hubbly",
  },
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: "0",
    highPrice: "1498",
    offerCount: 5,
  },
}

export default function ArchitecturePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      
      <main className="min-h-screen bg-background">
        <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 md:py-32">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-12"
          >
            ← Back to Home
          </Link>

          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent block mb-4">
            Architecture
          </span>
          
          {/* Hero */}
          <h1 className="font-[var(--font-bebas)] text-4xl md:text-6xl lg:text-7xl tracking-tight mb-6">
            The Hubbly Autonomous Revenue OS
          </h1>
          
          <p className="font-mono text-sm md:text-base text-muted-foreground mb-8 leading-relaxed">
            Hubbly is an autonomous revenue operating system that turns a company website, offer, and market position into a live pipeline engine. It analyzes what you sell, maps who should buy, builds the strategy, launches execution across channels, and learns from every reply, call, and meeting inside one coordinated system.
          </p>

          <p className="font-mono text-sm md:text-base text-muted-foreground mb-16 leading-relaxed">
            Unlike disconnected point tools, Hubbly does not split research, targeting, copy, outreach, calling, and booking across separate products that lose context at every handoff. It runs through 12 specialized agents, organized in 3 operating layers, all sharing one memory so the system stays aligned from first signal to scheduled meeting.
          </p>

          <div className="h-px w-full bg-border/30 mb-16" />

          {/* Section 1: The 12-Agent System */}
          <section className="mb-20">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-2">
              01 / The Core Mesh
            </span>
            <h2 className="font-[var(--font-bebas)] text-3xl md:text-5xl tracking-tight mb-6">
              The 12-Agent System
            </h2>
            <p className="font-mono text-sm text-muted-foreground mb-12 leading-relaxed max-w-3xl">
              Hubbly uses 12 specialized revenue agents instead of one general-purpose chatbot. Each agent has a defined role, a bounded job, and access to the same operating context, which keeps execution coordinated without collapsing everything into one opaque model.
            </p>

            {/* Intelligence Layer */}
            <div className="mb-12">
              <h3 className="font-[var(--font-bebas)] text-2xl md:text-3xl tracking-tight mb-2 text-green-500">
                Intelligence Layer
              </h3>
              <p className="font-mono text-sm text-muted-foreground mb-6 leading-relaxed">
                These agents build the strategic foundation before execution begins. Your team reviews the outputs at approval gates, so the system moves fast without running wild.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {intelligenceAgents.map((agent) => (
                  <div key={agent.name} className="border border-green-500/30 bg-green-500/5 p-5">
                    <h4 className="font-mono text-sm uppercase tracking-widest text-green-500 mb-2">{agent.name}</h4>
                    <p className="font-mono text-xs text-muted-foreground leading-relaxed">{agent.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Execution Layer */}
            <div className="mb-12">
              <h3 className="font-[var(--font-bebas)] text-2xl md:text-3xl tracking-tight mb-2 text-accent">
                Execution Layer
              </h3>
              <p className="font-mono text-sm text-muted-foreground mb-6 leading-relaxed">
                Once strategy is approved, execution agents turn the plan into pipeline. These agents handle buyer discovery, prioritization, messaging, delivery, calling, reply handling, scheduling, and revenue tracking.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {executionAgents.map((agent) => (
                  <div key={agent.name} className="border border-accent/30 bg-accent/5 p-5">
                    <h4 className="font-mono text-sm uppercase tracking-widest text-accent mb-2">{agent.name}</h4>
                    <p className="font-mono text-xs text-muted-foreground leading-relaxed">{agent.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Optimization Layer */}
            <div className="mb-12">
              <h3 className="font-[var(--font-bebas)] text-2xl md:text-3xl tracking-tight mb-2 text-purple-500">
                Optimization Layer
              </h3>
              <p className="font-mono text-sm text-muted-foreground leading-relaxed max-w-3xl">
                Hubbly&apos;s improvement layer continuously learns from signals, replies, meetings, and conversion patterns. The Track, Optimize, and Advisor behaviors operate within the broader &quot;understand, execute, improve&quot; loop, so the system gets sharper over time instead of restarting every campaign from zero.
              </p>
            </div>

            {/* Why Specialized Agents */}
            <div className="border-l-2 border-accent pl-6">
              <h3 className="font-[var(--font-bebas)] text-xl md:text-2xl tracking-tight mb-3">
                Why specialized agents beat one chatbot
              </h3>
              <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                A monolithic chatbot can generate output, but it does not naturally maintain clean operational boundaries across research, targeting, writing, delivery, reply handling, booking, and optimization. Hubbly separates those roles into specialized agents, then coordinates them through shared memory and approval logic so the system behaves like an operating model rather than a prompt box.
              </p>
            </div>
          </section>

          <div className="h-px w-full bg-border/30 mb-16" />

          {/* Section 2: Shared Memory */}
          <section className="mb-20">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-2">
              02 / Shared Memory
            </span>
            <h2 className="font-[var(--font-bebas)] text-3xl md:text-5xl tracking-tight mb-6">
              The Shared Memory &amp; Context Layer
            </h2>
            <p className="font-mono text-sm text-muted-foreground mb-8 leading-relaxed max-w-3xl">
              At the center of Hubbly is one shared operating memory. Every agent works from the same context, so research, scoring, copy, voice, booking, and tracking stay aligned from first signal to scheduled meeting.
            </p>
            <p className="font-mono text-sm text-muted-foreground mb-8 leading-relaxed max-w-3xl">
              This matters because most revenue stacks lose context at every handoff between enrichment tools, sequencers, dialers, calendars, CRMs, and spreadsheets. Hubbly keeps business context, buyer logic, outreach history, reply status, and execution outcomes in one coordinated system instead of forcing teams to rebuild state across tools.
            </p>

            <h3 className="font-mono text-sm uppercase tracking-widest text-foreground mb-4">What the shared layer does</h3>
            <ul className="space-y-3 mb-8">
              {sharedMemoryFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-accent mt-1">—</span>
                  <span className="font-mono text-sm text-muted-foreground leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="border-l-2 border-accent pl-6">
              <h3 className="font-[var(--font-bebas)] text-xl md:text-2xl tracking-tight mb-3">
                Why it matters
              </h3>
              <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                Without shared memory, every tool behaves like an isolated workspace and every handoff becomes a reset. With shared memory, Hubbly can move from URL in to pipeline out without losing the strategic context that made the campaign valuable in the first place.
              </p>
            </div>
          </section>

          <div className="h-px w-full bg-border/30 mb-16" />

          {/* Section 3: Human Oversight */}
          <section className="mb-20">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-2">
              03 / Oversight Model
            </span>
            <h2 className="font-[var(--font-bebas)] text-3xl md:text-5xl tracking-tight mb-6">
              Human-in-the-Loop Oversight
            </h2>
            <p className="font-mono text-sm text-muted-foreground mb-8 leading-relaxed max-w-3xl">
              Hubbly is designed to automate execution while keeping humans in control where judgment matters most. &quot;You approve. Hubbly executes.&quot; — with five approval gates between intelligence and execution.
            </p>
            <p className="font-mono text-sm text-muted-foreground mb-8 leading-relaxed max-w-3xl">
              That means the system does not independently invent the company profile, ICP, strategy, or creative and then start running in the background without oversight. Instead, it builds the work, presents it for approval, and only then activates the execution layer.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-mono text-sm uppercase tracking-widest text-green-500 mb-4">Where humans approve</h3>
                <ul className="space-y-2">
                  {humanApprovalPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-green-500 mt-1">✓</span>
                      <span className="font-mono text-sm text-muted-foreground leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-mono text-sm uppercase tracking-widest text-accent mb-4">What stays automated</h3>
                <ul className="space-y-2">
                  {automatedPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-accent mt-1">→</span>
                      <span className="font-mono text-sm text-muted-foreground leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="font-mono text-sm text-muted-foreground leading-relaxed border-l-2 border-accent pl-6">
              This balance is the point: Hubbly automates the repetitive, cross-system execution work, while your team stays focused on the moments where business judgment and real conversations matter.
            </p>
          </section>

          <div className="h-px w-full bg-border/30 mb-16" />

          {/* Section 4: Execution Loop */}
          <section className="mb-20">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-2">
              04 / Execution Loop
            </span>
            <h2 className="font-[var(--font-bebas)] text-3xl md:text-5xl tracking-tight mb-6">
              Execution &amp; Optimization Engine
            </h2>
            <p className="font-mono text-sm text-muted-foreground mb-8 leading-relaxed max-w-3xl">
              Once approvals are complete, Hubbly turns strategy into action across the full revenue workflow. Analyze the business, build the ICP, launch execution, then book and learn.
            </p>
            <p className="font-mono text-sm text-muted-foreground mb-8 leading-relaxed max-w-3xl">
              That execution loop is what makes Hubbly feel like an operating system instead of a single-feature tool. It does not stop at copy generation or lead enrichment; it connects strategy, signals, outreach, voice, replies, meetings, and revenue outcomes inside one coordinated cycle.
            </p>

            <h3 className="font-mono text-sm uppercase tracking-widest text-foreground mb-4">How agents coordinate</h3>
            <ol className="space-y-4 mb-8">
              <li className="flex items-start gap-4">
                <span className="font-mono text-sm text-accent">01</span>
                <span className="font-mono text-sm text-muted-foreground leading-relaxed">Hubbly ingests the website, offer, market, and positioning to understand the business.</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="font-mono text-sm text-accent">02</span>
                <span className="font-mono text-sm text-muted-foreground leading-relaxed">It maps the ICP, filters low-intent prospects, and identifies accounts worth pursuing.</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="font-mono text-sm text-accent">03</span>
                <span className="font-mono text-sm text-muted-foreground leading-relaxed">It writes outreach, enriches contacts, sends email, places voice calls, and adapts sequences from live signals.</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="font-mono text-sm text-accent">04</span>
                <span className="font-mono text-sm text-muted-foreground leading-relaxed">It books meetings, classifies replies, tracks outcomes, and uses conversion feedback to improve future cycles.</span>
              </li>
            </ol>

            <div className="border-l-2 border-purple-500 pl-6">
              <h3 className="font-[var(--font-bebas)] text-xl md:text-2xl tracking-tight mb-3 text-purple-500">
                How results improve the system
              </h3>
              <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                Every reply, objection, meeting outcome, and conversion pattern feeds back into the operating loop. That gives Hubbly a practical optimization layer: the system refines targeting, messaging, prioritization, and follow-up based on what actually happened in-market.
              </p>
            </div>
          </section>

          <div className="h-px w-full bg-border/30 mb-16" />

          {/* FAQ Section */}
          <section className="mb-20">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-2">
              05 / FAQ
            </span>
            <h2 className="font-[var(--font-bebas)] text-3xl md:text-5xl tracking-tight mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-8">
              {faqs.map((faq, index) => (
                <div key={index} className="border-l-2 border-border/50 pl-6">
                  <h3 className="font-mono text-sm text-foreground mb-3">{faq.question}</h3>
                  <p className="font-mono text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
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
              Run My Revenue Audit
            </a>
            <a
              href="/platform"
              className="inline-flex items-center justify-center gap-2 border border-border/50 px-6 py-4 font-mono text-xs uppercase tracking-widest text-foreground hover:bg-card/50 transition-all duration-200"
            >
              View Platform
            </a>
            <a
              href="/waitlist"
              className="inline-flex items-center justify-center gap-2 border border-border/50 px-6 py-4 font-mono text-xs uppercase tracking-widest text-foreground hover:bg-card/50 transition-all duration-200"
            >
              Join Waitlist
            </a>
          </div>
        </div>
      </main>
    </>
  )
}
