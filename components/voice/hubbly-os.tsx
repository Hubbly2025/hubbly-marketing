/**
 * Voice inside Hubbly OS.
 *
 * The one place on the page where the orange parent-brand color appears: OS
 * nodes are orange, the Voice node is blue. That contrast is the whole argument
 * of the section — Voice is a product inside a larger operating system, not a
 * bolt-on tool.
 *
 * Voice must never be positioned as a feature of a CRM, and the section must not
 * imply that buying Hubbly OS is required. The copy says Voice can run alone.
 */

import { Reveal } from "@/components/landing-interactions"
import { SectionHeading } from "@/components/voice/section"
import { os } from "@/lib/voice-content"

export function HubblyOs() {
  return (
    <section id="hubbly-os" className="scroll-mt-32 bg-background px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1440px]">
        <Reveal>
          <SectionHeading eyebrow={os.eyebrow} headline={os.headline} body={os.body} align="center" />
        </Reveal>

        <Reveal className="mt-16">
          <ol className="mx-auto flex max-w-[880px] flex-col items-stretch gap-0">
            {os.nodes.map((node, index) => (
              <li key={`${node.title}-${index}`} className="flex flex-col items-center">
                <div
                  className={`flex w-full flex-col gap-2 border p-5 text-center ${
                    node.kind === "voice"
                      ? "border-accent bg-card"
                      : node.kind === "os"
                        ? "border-border bg-card"
                        : "border-border/60 bg-background"
                  }`}
                >
                  <span
                    className={`font-mono text-[11px] font-bold tracking-[0.16em] ${
                      node.kind === "voice"
                        ? "text-accent"
                        : node.kind === "os"
                          ? // Orange is reserved strictly for the parent brand.
                            "text-accent-brand"
                          : "text-muted-foreground/70"
                    }`}
                  >
                    {node.title}
                  </span>
                  {node.detail && (
                    <span className="font-mono text-[10px] leading-relaxed tracking-[0.1em] text-muted-foreground/70">
                      {node.detail}
                    </span>
                  )}
                </div>
                {index < os.nodes.length - 1 && (
                  <span aria-hidden="true" className="h-6 w-px bg-muted" />
                )}
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal className="mt-12">
          <p className="text-center font-mono text-[11px] tracking-[0.16em] text-muted-foreground">
            {os.support}
          </p>
        </Reveal>
      </div>
    </section>
  )
}
