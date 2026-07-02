const tiers = [
  { name: "Free", price: "$0" },
  { name: "Signal", price: "$98" },
  { name: "Pro", price: "$298" },
  { name: "Autopilot", price: "$498", popular: true },
  { name: "Workforce", price: "$995" },
  { name: "Agency", price: "$2,500+" },
]

export function PricingTeaserSection() {
  return (
    <section
      id="pricing"
      className="relative border-t border-border/30 px-4 py-24 md:py-32 md:pl-28 md:pr-12"
    >
      <div className="mb-10 md:mb-12 max-w-3xl">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">06 / PRICING</span>
        <h2 className="mt-4 md:mt-6 font-[var(--font-bebas)] text-4xl md:text-7xl tracking-tight text-balance">
          One system. Priced to scale with your pipeline.
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative flex flex-col border bg-card/30 p-5 md:p-6 transition-colors duration-300 ${
              tier.popular ? "border-accent" : "border-border/50 hover:border-accent/60"
            }`}
          >
            {tier.popular && (
              <span className="absolute -top-3 left-5 bg-accent px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-background">
                Most popular
              </span>
            )}
            <h3 className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{tier.name}</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-[var(--font-bebas)] text-3xl md:text-4xl tracking-tight text-foreground">
                {tier.price}
              </span>
              <span className="font-mono text-xs text-muted-foreground">/mo</span>
            </div>
          </div>
        ))}
      </div>

      <a
        href="/pricing"
        className="mt-8 md:mt-10 inline-flex items-center gap-2 border-b border-accent/40 pb-[2px] font-mono text-xs uppercase tracking-widest text-accent transition-colors hover:text-accent/80"
      >
        See full pricing →
      </a>
    </section>
  )
}
