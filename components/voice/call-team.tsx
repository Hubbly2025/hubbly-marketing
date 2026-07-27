"use client"

/**
 * Meet your call team — six role cards plus a workflow rail.
 *
 * Hovering or focusing a card highlights its step on the rail. Focus is wired
 * as well as hover so the relationship is reachable by keyboard, and the rail
 * is aria-hidden because it's a visual echo of information already in the card.
 *
 * The gated roles (inbound receptionist, warm transfer, SMS/email) are filtered
 * out by allowedItems, so they cannot appear until their claim is verified.
 *
 * No avatars, robots, or cartoon employees — these are jobs, not characters.
 */

import { useState } from "react"

import { Reveal } from "@/components/landing-interactions"
import { SectionHeading } from "@/components/voice/section"
import { allowedItems } from "@/lib/voice-claims"
import { roles, team } from "@/lib/voice-content"

export function CallTeam() {
  const visibleRoles = allowedItems(roles)
  const [activeId, setActiveId] = useState<string | null>(null)

  return (
    <section id="team" className="scroll-mt-32 bg-background px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1440px]">
        <Reveal>
          <SectionHeading eyebrow={team.eyebrow} headline={team.headline} body={team.body} />
        </Reveal>

        {/* Workflow rail. Purely a visual echo of the cards below. */}
        <Reveal className="mt-12">
          <div
            aria-hidden="true"
            className="flex items-stretch gap-px overflow-hidden border border-border/60 bg-border"
          >
            {visibleRoles.map((role) => {
              const active = activeId === role.id
              return (
                <div
                  key={role.id}
                  className={`flex flex-1 items-center justify-center bg-card px-2 py-3 transition-colors ${
                    active ? "bg-accent" : ""
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] tracking-[0.16em] tnum transition-colors ${
                      active ? "text-foreground" : "text-muted-foreground/70"
                    }`}
                  >
                    {role.index}
                  </span>
                </div>
              )
            })}
          </div>
        </Reveal>

        <div className="mt-8 grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
          {visibleRoles.map((role) => (
            <div
              key={role.id}
              // tabIndex makes the hover relationship keyboard-reachable. The
              // card is not a link or button, so it takes no other role.
              tabIndex={0}
              onMouseEnter={() => setActiveId(role.id)}
              onMouseLeave={() => setActiveId(null)}
              onFocus={() => setActiveId(role.id)}
              onBlur={() => setActiveId(null)}
              className="group flex min-h-[220px] flex-col justify-between bg-background p-7 outline-none transition-colors hover:bg-card focus-visible:bg-card focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-border"
            >
              <div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[11px] tracking-[0.16em] text-accent tnum">
                    {role.index}
                  </span>
                  <span className="h-px flex-1 bg-border transition-colors group-hover:bg-muted" aria-hidden="true" />
                </div>
                <h3 className="mt-6 font-mono text-[12px] font-bold leading-relaxed tracking-[0.12em] text-foreground">
                  {role.name}
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground/70">{role.description}</p>
              </div>
              <span className="mt-7 font-mono text-[10px] tracking-[0.16em] text-muted-foreground/70">
                {role.category}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
