/**
 * Integrations — categories, not vendor logos.
 *
 * Naming a vendor implies a shipped, supported integration, so this renders
 * neutral capability categories until the specificIntegrations claim is
 * verified. That also keeps us clear of third-party trademark use.
 *
 * The support line does the strategic work: Hubbly owns the workflow, and the
 * infrastructure underneath stays replaceable.
 */

import { Reveal } from "@/components/landing-interactions"
import { SectionHeading } from "@/components/voice/section"
import { voiceClaims } from "@/lib/voice-claims"
import { integrations } from "@/lib/voice-content"

export function VoiceIntegrations() {
  return (
    <section
      id="integrations"
      className="scroll-mt-32 border-y border-border/60 bg-card px-6 py-24 md:py-32"
    >
      <div className="mx-auto max-w-[1440px]">
        <Reveal>
          <SectionHeading
            eyebrow={integrations.eyebrow}
            headline={integrations.headline}
            body={integrations.body}
            align="center"
          />
        </Reveal>

        <Reveal className="mt-14">
          <div className="mx-auto grid max-w-[1040px] grid-cols-2 gap-px bg-border md:grid-cols-3">
            {integrations.categories.map((category) => (
              <div
                key={category.name}
                className="flex min-h-[120px] flex-col justify-between bg-background p-6"
              >
                <span className="font-mono text-[12px] font-bold tracking-[0.12em] text-foreground">
                  {category.name}
                </span>
                <span
                  className={`font-mono text-[10px] tracking-[0.16em] ${
                    category.status === "CONNECTED" ? "text-accent" : "text-muted-foreground/70"
                  }`}
                >
                  {category.status}
                </span>
              </div>
            ))}
          </div>
        </Reveal>

        {!voiceClaims.specificIntegrations && (
          <Reveal className="mt-10">
            <p className="mx-auto max-w-[620px] text-center text-sm leading-relaxed text-muted-foreground/70">
              {integrations.support}
            </p>
          </Reveal>
        )}
      </div>
    </section>
  )
}
