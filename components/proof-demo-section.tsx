import LazyDemo from "@/components/lazy-demo"

export function ProofDemoSection() {
  return (
    <section
      id="proof-demo"
      className="relative py-20 md:py-24 px-4 md:pl-28 md:pr-12 border-t border-border/30"
    >
      <div className="mb-10 md:mb-12">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">PROOF</span>
        <h2 className="mt-4 md:mt-6 font-[var(--font-bebas)] text-4xl md:text-5xl tracking-tight">
          Not ready to drop your URL in? Watch it work.
        </h2>
        <p className="mt-4 font-mono text-sm text-muted-foreground max-w-2xl">
          A self-running pass on a sample market — every number labeled.
        </p>
      </div>

      <div className="mx-auto max-w-6xl">
        <LazyDemo src="/demos/hubbly-autopilot-demo.html" title="Hubbly autopilot demo" />
      </div>

      <div className="mt-8 text-center">
        <a
          href="#hero"
          className="font-mono text-[11px] md:text-xs uppercase tracking-widest text-foreground/60 hover:text-foreground transition-colors duration-200"
        >
          Ready? See what Hubbly finds →
        </a>
      </div>
    </section>
  )
}
