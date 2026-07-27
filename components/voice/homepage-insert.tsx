/**
 * HUBBLY VOICE block for the main Hubbly OS marketing homepage.
 *
 * Not a second Voice landing page — one concise block that makes the
 * relationship clear and sends people to the Voice page. Drop it into the OS
 * homepage with <VoiceHomepageInsert />; the copy lives in the content model so
 * it can never drift from the Voice page's own positioning.
 *
 * Color rule: Voice blue inside this section, and orange only on the "HUBBLY OS"
 * parent-brand signal. It keeps the OS homepage's own visual system otherwise.
 *
 * ctaHref points at "/" because the Voice page is currently the root route. If
 * Voice moves to /voice, change homepageInsert.ctaHref in lib/voice-content.ts.
 */

import { WorkFeed } from "@/components/voice/work-feed"
import { homepageInsert } from "@/lib/voice-content"

export function VoiceHomepageInsert() {
  return (
    <section
      aria-labelledby="voice-insert-heading"
      className="border-y border-border/60 bg-background px-6 py-20 md:py-24"
    >
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_400px] lg:gap-20">
        <div>
          <span className="font-mono text-[11px] tracking-[0.2em] text-accent">
            {homepageInsert.eyebrow}
          </span>
          <h2
            id="voice-insert-heading"
            className="mt-5 font-display tracking-wide leading-[1.08] text-foreground text-balance"
            style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}
          >
            {homepageInsert.headline}
          </h2>
          <p className="mt-5 max-w-[560px] text-[16px] leading-relaxed text-muted-foreground">
            {homepageInsert.body}
          </p>

          <div className="mt-9 flex flex-col gap-5 sm:flex-row sm:items-center">
            <a
              href={homepageInsert.ctaHref}
              className="inline-flex min-h-12 items-center justify-center bg-accent px-7 font-mono text-[11px] tracking-[0.14em] text-accent-foreground transition-colors hover:bg-accent/90"
            >
              {homepageInsert.cta}
            </a>
            <p className="font-mono text-[10px] leading-relaxed tracking-[0.14em] text-muted-foreground/70">
              {/* Orange marks the parent brand, and only here. */}
              Voice handles the conversation.{" "}
              <span className="text-accent-brand">HUBBLY OS</span> runs the operation.
            </p>
          </div>
        </div>

        <WorkFeed steps={homepageInsert.feed} />
      </div>
    </section>
  )
}
