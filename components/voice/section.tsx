/**
 * Shared section chrome: the eyebrow / headline / body stack that repeats down
 * the page, plus a small "example" tag for anything showing sample data.
 *
 * Centralized so type scale, measure, and spacing stay identical across every
 * section rather than drifting per-component.
 */

export function SectionHeading({
  eyebrow,
  headline,
  body,
  align = "left",
  id,
}: {
  eyebrow: string
  headline: React.ReactNode
  body?: string
  align?: "left" | "center"
  id?: string
}) {
  const centered = align === "center"

  return (
    <div className={centered ? "mx-auto max-w-[760px] text-center" : "max-w-[860px]"}>
      <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground/70">{eyebrow}</span>
      <h2
        id={id}
        className="mt-6 font-display tracking-wide leading-[1.08] text-foreground text-balance"
        style={{ fontSize: "clamp(1.9rem, 3.4vw, 2.75rem)" }}
      >
        {headline}
      </h2>
      {body && (
        // Reading measure capped well under the 1440px shell so long copy never
        // runs the full page width.
        <p
          className={`mt-6 text-[17px] leading-relaxed text-muted-foreground ${centered ? "mx-auto" : ""} max-w-[680px]`}
        >
          {body}
        </p>
      )}
    </div>
  )
}

/** Marks any sample interface so it can't be mistaken for real customer data. */
export function ExampleTag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 border border-border/60 bg-secondary px-2.5 py-1 font-mono text-[10px] tracking-[0.16em] text-muted-foreground/70">
      {label}
    </span>
  )
}
