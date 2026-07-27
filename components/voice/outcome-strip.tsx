/**
 * Operating outcome strip — six jobs the call team owns.
 *
 * These are capabilities, not results: no percentages, no customer metrics.
 * 2 columns on mobile, 3 on tablet, 6 across on desktop, with the grid's own
 * 1px lines doing the dividing rather than per-cell borders.
 */

import { outcomeCells } from "@/lib/voice-content"

export function OutcomeStrip() {
  return (
    <section aria-label="What the call team does" className="border-y border-border/60 bg-card">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-px bg-border sm:grid-cols-3 lg:grid-cols-6">
        {outcomeCells.map((cell) => (
          <div key={cell.index} className="flex min-h-[104px] flex-col justify-between bg-card p-5">
            <span className="font-mono text-[10px] tracking-[0.16em] text-accent tnum">{cell.index}</span>
            <span className="font-mono text-[11px] leading-relaxed tracking-[0.12em] text-foreground">
              {cell.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
