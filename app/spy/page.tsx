import type { Metadata } from "next"
import { StickyHeader } from "@/components/sticky-header"
import { SideNav } from "@/components/side-nav"
import { FloatingCTA } from "@/components/floating-cta"
import { FooterSection } from "@/components/footer-section"
import { Reveal } from "@/components/autopilot/reveal"
import LazyDemo from "@/components/lazy-demo"
import { pageMetadata, productJsonLd } from "@/lib/seo"

const appJsonLd = productJsonLd({
  name: "Hubbly Spy",
  description:
    "Hubbly Spy watches the page-one field around the searches that pay you and turns every competitor move into a counter-move. One of five Hubbly product lines — Signal, Rank, Send, Voice, and Spy — running from one shared buyer context, on autopilot by default with opt-in approval gates.",
  path: "/spy",
})

export const metadata: Metadata = pageMetadata({
  title: "Hubbly Spy — Competitor intelligence",
  description:
    "Hubbly Spy watches the page-one field around the searches that pay you and turns every competitor move into a counter-move. Your free audit includes Spy's first pass at your market.",
  path: "/spy",
})

export default function SpyPage() {
  return (
    <main className="relative min-h-screen bg-background grid-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
      <div className="noise-overlay" aria-hidden="true" />
      <StickyHeader />
      <SideNav />
      <FloatingCTA />

      {/* DEMO HERO */}
      <section className="px-4 pt-24 pb-4 md:px-8 md:pt-28">
        <div className="mx-auto w-full max-w-[1400px]">
          <LazyDemo
            src="/demos/hubbly-agent-demos.html?demo=spy"
            title="Hubbly Spy demo"
            aspect={null}
            className="h-[min(80vh,860px)]"
          />
        </div>
      </section>

      {/* COPY */}
      <section className="px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto w-full max-w-3xl">
          <Reveal>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">
              Hubbly Spy · Competitor intelligence
            </p>
          </Reveal>
          <Reveal delay={120}>
            <h1 className="mt-6 font-[var(--font-bebas)] text-5xl leading-[0.95] tracking-tight text-balance sm:text-6xl lg:text-7xl">
              They&apos;re moving on your keywords right now.
            </h1>
          </Reveal>
          <Reveal delay={240}>
            <p className="mt-6 max-w-[640px] font-mono text-sm leading-relaxed text-muted-foreground md:text-base">
              Hubbly Spy watches the page-one field around the searches that pay you and turns every
              competitor move into a counter-move. Your free audit includes Spy&apos;s first pass at your
              market — your competitors, your battleground keywords, your revenue at risk.
            </p>
          </Reveal>
          <Reveal delay={360}>
            <a
              href="/#audit"
              className="mt-10 inline-flex min-h-12 items-center justify-center bg-accent px-8 font-mono text-xs uppercase tracking-widest text-background transition-opacity duration-200 hover:opacity-90"
            >
              See what they&apos;re doing →
            </a>
          </Reveal>
        </div>
      </section>

      <FooterSection />
    </main>
  )
}
