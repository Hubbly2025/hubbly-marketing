/**
 * FAQ (v2).
 *
 * A separate component from components/faq.tsx, which is left frozen as the v1
 * version so the revert flag restores the old page exactly.
 *
 * Questions come from the content model and are filtered through the claim
 * registry, so the live-monitoring and DNC/consent answers stay hidden until
 * those paths are verified. Notably absent and intentionally so: pricing.
 * Hubbly Voice is sales-led with no published tiers, so there is no cost answer
 * to give here.
 *
 * Keyboard and screen-reader behavior comes from the shared accordion primitive.
 */

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Reveal } from "@/components/landing-interactions"
import { allowedItems } from "@/lib/voice-claims"
import { faqItems } from "@/lib/voice-content"

export function VoiceFaq() {
  const items = allowedItems(faqItems)

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="scroll-mt-32 border-t border-border/60 bg-background px-6 py-24 md:py-32"
    >
      <div className="mx-auto max-w-[820px]">
        <Reveal>
          <div className="text-center">
            <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground/70">FAQ</span>
            <h2
              id="faq-heading"
              className="mt-6 font-display tracking-wide text-foreground text-balance"
              style={{ fontSize: "clamp(1.9rem, 3.4vw, 2.75rem)" }}
            >
              Questions teams ask first
            </h2>
          </div>
        </Reveal>

        {/* This repo's accordion primitive is Radix-based, so one-open-at-a-time
            is expressed as type="single". collapsible lets the open item close
            again, matching the previous Base UI behaviour. */}
        <Accordion type="single" collapsible className="mt-12">
          {items.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className="font-display text-base tracking-wide text-foreground">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-[15px] leading-relaxed text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
