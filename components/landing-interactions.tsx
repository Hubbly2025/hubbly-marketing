"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";

import { navItems } from "@/components/nav-items";

const rouletteLetters = ["H", "U", "B", "B", "L", "Y"];
const rouletteAlternates = [
  ["R", "N", "H"],
  ["V", "O", "U"],
  ["P", "R", "B"],
  ["D", "P", "B"],
  ["I", "T", "L"],
  ["V", "X", "Y"],
];

/** `compact` opts into the shorter v2 masthead scale. v1 omits it. */
export function RouletteWordmark({ compact = false }: { compact?: boolean } = {}) {
  return (
    <div className={`roulette-word ${compact ? "roulette-word--compact" : ""}`} aria-label="Hubbly">
      {rouletteLetters.map((letter, index) => (
        <span
          key={`${letter}-${index}`}
          className="roulette-window"
          style={{ "--reel-delay": `${index * 90}ms` } as React.CSSProperties}
          aria-hidden="true"
        >
          <span className="roulette-reel">
            {rouletteAlternates[index].map((alternate) => (
              <span key={alternate}>{alternate}</span>
            ))}
            <span className="relative">
              {letter}
              {index === 1 && <span className="u-dot" />}
            </span>
          </span>
        </span>
      ))}
    </div>
  );
}

export function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add("is-visible");
          observer.unobserve(node);
        }
      },
      { threshold: 0.12 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return (
    <div ref={setNode} className={`reveal ${className}`}>
      {children}
    </div>
  );
}

/**
 * Nav and CTA copy are props with v1 defaults, so the preserved v1 page keeps
 * its original menu while v2 passes its own. Without this, editing the shared
 * nav list would silently rewrite the page we're keeping for the revert.
 */
export function MobileMenu({
  items = navItems,
  ctaLabel = "GET STARTED",
  ctaHref = "#get-started",
  hideClassName = "md:hidden",
}: {
  items?: readonly (readonly [string, string])[];
  ctaLabel?: string;
  ctaHref?: string;
  /**
   * The breakpoint at which this menu hides. It MUST match the breakpoint at
   * which the caller's desktop nav appears.
   *
   * This wrapper was hardcoded `md:hidden`. v2's desktop nav starts at
   * `lg:flex` (five items collide at md), so the hamburger disappeared at
   * 768px while the desktop nav did not appear until 1024px, leaving
   * 768-1023px with no navigation at all. Browser testing caught it.
   *
   * Both literals ("md:hidden" here, "lg:hidden" at the v2 call site) appear
   * in source, so Tailwind still generates them.
   */
  hideClassName?: string;
} = {}) {
  const [open, setOpen] = useState(false);

  // No `relative` on the wrapper below: the dropdown panel is
  // `absolute inset-x-0 top-full` and is meant to span the full-width header,
  // which is the positioned ancestor. Adding `relative` would clamp the panel
  // to the hamburger button's width.
  return (
    <div className={hideClassName}>
      <button
        type="button"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex size-11 items-center justify-center border border-border/60 bg-background text-foreground"
      >
        {open ? <X aria-hidden="true" size={18} /> : <Menu aria-hidden="true" size={18} />}
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full border-b border-border/60 bg-background p-5">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1 font-mono text-xs tracking-[0.14em]">
            {items.map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="border-b border-border/60 px-2 py-4 text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </a>
            ))}
            <div className="mt-4 flex gap-3">
              <a href="/login" className="flex min-h-11 flex-1 items-center justify-center border border-border/60 px-4 text-muted-foreground">
                SIGN IN
              </a>
              <a href={ctaHref} onClick={() => setOpen(false)} className="flex min-h-11 flex-1 items-center justify-center bg-accent px-4 text-center text-accent-foreground">
                {ctaLabel}
              </a>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}

/**
 * Website-intake CTA.
 *
 * Label and microcopy are props defaulted to the v1 strings so the preserved v1
 * page is unaffected by v2's wording.
 *
 * This is a real form that submits to the onboarding route and carries the
 * entered site along as a query param, rather than the previous "PREVIEW MODE"
 * stub that went nowhere. type="url" plus required gives native validation, so
 * an empty or malformed entry never navigates.
 */
export function VisualCta({
  label = "GET STARTED",
  microcopy = "NO CREDIT CARD REQUIRED",
  action = "/signup",
}: {
  label?: string;
  microcopy?: string;
  action?: string;
} = {}) {
  const [value, setValue] = useState("");

  return (
    <form
      action={action}
      method="get"
      className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4"
    >
      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="website-url">
          Your company website
        </label>
        <input
          id="website-url"
          name="website"
          type="url"
          required
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="yourcompany.com"
          className="min-h-14 flex-1 border border-border bg-secondary px-5 font-mono text-sm text-foreground placeholder:text-muted-foreground/70"
        />
        <button
          type="submit"
          className="flex min-h-14 items-center justify-center gap-3 bg-accent px-7 font-mono text-xs tracking-[0.14em] text-accent-foreground transition-colors hover:bg-accent/90"
        >
          {label} <ArrowRight aria-hidden="true" size={16} />
        </button>
      </div>
      <p className="text-center font-mono text-[11px] tracking-[0.14em] text-muted-foreground/70">{microcopy}</p>
    </form>
  );
}
