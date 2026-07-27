"use client"

/**
 * The workspace — a three-panel example shell whose activity feed drives the
 * detail panel. The section nav row above the panels is static chrome; see the
 * comment on it for why it is deliberately not a tablist.
 *
 * Entirely client-side and static: no fake backend, no invented metrics. The
 * shell is labelled EXAMPLE WORKSPACE so no one reads it as customer results.
 *
 * On mobile the three panels collapse to a single column; the campaign list and
 * detail panel stack under the feed rather than being hidden, so nothing is
 * unreachable on a phone.
 */

import { useState } from "react"

import { Reveal } from "@/components/landing-interactions"
import { ExampleTag, SectionHeading } from "@/components/voice/section"
import { workspace } from "@/lib/voice-content"

/** Detail shown per feed event. Fictional contact, clearly example data. */
const details = [
  { stage: "New", disposition: "Lead received", next: "Place first call" },
  { stage: "Attempting", disposition: "Call started", next: "Await answer" },
  { stage: "In conversation", disposition: "Connected", next: "Run qualification" },
  { stage: "Qualified", disposition: "Qualification completed", next: "Offer times" },
  { stage: "Booked", disposition: "Meeting booked", next: "Send recap" },
  { stage: "Needs human", disposition: "Human follow-up requested", next: "Assign owner" },
  { stage: "Booked", disposition: "Record updated", next: "Confirm 24h prior" },
]

export function Workspace() {
  const [selected, setSelected] = useState(4)
  const detail = details[selected]

  return (
    <section id="workspace" className="scroll-mt-32 bg-background px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1440px]">
        <Reveal>
          <SectionHeading
            eyebrow={workspace.eyebrow}
            headline={workspace.headline}
            body={workspace.body}
          />
        </Reveal>

        <Reveal className="mt-14">
          <div className="overflow-hidden border border-border bg-card">
            {/* Shell chrome */}
            <div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3">
              <span className="font-mono text-[11px] font-bold tracking-[0.14em] text-foreground">
                HUBBLY VOICE
              </span>
              <ExampleTag label={workspace.exampleLabel} />
            </div>

            {/*
              Static navigation chrome, NOT a tablist.

              This was previously role="tablist" with clickable role="tab"
              buttons, which was wrong on two counts: there was no
              corresponding role="tabpanel", and switching tabs did not change
              the content below — clicking CONTACTS still showed campaign data.
              That is a false affordance, and browser testing caught it.

              Since this is a labelled EXAMPLE shell, the honest presentation is
              a non-interactive nav row that shows where the panels below live.
              aria-current marks the displayed section. The genuinely
              interactive part of this mockup is the activity feed, which does
              drive the detail panel.

              If these should become real tabs later, each needs its own panel
              content and a matching role="tabpanel".
            */}
            <div
              aria-label="Workspace sections (example)"
              className="flex overflow-x-auto border-b border-border/60"
            >
              {workspace.tabs.map((label, index) => (
                <span
                  key={label}
                  aria-current={index === 0 ? "true" : undefined}
                  className={`shrink-0 border-b px-4 py-3 font-mono text-[10px] tracking-[0.16em] ${
                    index === 0
                      ? "border-accent text-foreground"
                      : "border-transparent text-muted-foreground/70"
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-px bg-border lg:grid-cols-[210px_1fr_280px]">
              {/* Campaigns */}
              <div className="bg-card p-4">
                <span className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground/70">CAMPAIGNS</span>
                <ul className="mt-3 flex flex-col gap-1">
                  {workspace.campaigns.map((campaign, index) => (
                    <li
                      key={campaign}
                      className={`px-2 py-2 text-[12px] leading-relaxed ${
                        index === 0
                          ? "border-l-2 border-accent bg-secondary text-foreground"
                          : "text-muted-foreground/70"
                      }`}
                    >
                      {campaign}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Feed */}
              <div className="bg-card p-4">
                <span className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground/70">ACTIVITY</span>
                <ul className="mt-3 flex flex-col">
                  {workspace.feed.map((event, index) => {
                    const isSelected = index === selected
                    return (
                      <li key={event}>
                        <button
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setSelected(index)}
                          className={`flex w-full items-center gap-3 border-b border-border/60 px-2 py-3 text-left transition-colors ${
                            isSelected ? "bg-secondary" : "hover:bg-secondary/50"
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`size-1.5 shrink-0 rounded-full ${
                              isSelected ? "bg-accent" : "bg-muted-foreground"
                            }`}
                          />
                          <span
                            className={`text-[12px] ${isSelected ? "text-foreground" : "text-muted-foreground"}`}
                          >
                            {event}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {/* Detail */}
              <div className="bg-card p-4">
                <span className="font-mono text-[10px] tracking-[0.16em] text-muted-foreground/70">CONTACT</span>
                <p className="mt-3 font-display text-base tracking-wide text-foreground">Dana Whitfield</p>
                <p className="text-[12px] text-muted-foreground/70">Whitfield Roofing · Web form</p>
                <dl className="mt-5 flex flex-col gap-3">
                  {[
                    ["STAGE", detail.stage],
                    ["LATEST DISPOSITION", detail.disposition],
                    ["NEXT ACTION", detail.next],
                  ].map(([label, value]) => (
                    <div key={label} className="flex flex-col gap-1 border-t border-border/60 pt-3">
                      <dt className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground/70">{label}</dt>
                      <dd className="text-[12px] text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
