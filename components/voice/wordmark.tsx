/**
 * HUBBLY VOICE lockup.
 *
 * Extracted from the page so the header and footer share one definition. The
 * dot under the U is the brand mark and is decorative, so the accessible name
 * comes from the surrounding link, not from the glyph.
 */

export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2 border border-border px-3 py-2 font-mono text-[13px] font-bold tracking-[0.16em]">
      <span className="text-accent">
        H
        <span className="relative inline-block">
          U
          <span
            className="absolute bottom-[0.28em] left-1/2 size-[0.24em] -translate-x-1/2 rounded-full bg-background"
            aria-hidden="true"
          />
        </span>
        BBLY
      </span>
      <span className="text-accent">VOICE</span>
    </span>
  )
}
