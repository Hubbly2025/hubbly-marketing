/**
 * Footer.
 *
 * Only routes that actually exist in this project: /login, /signup, /privacy,
 * /terms, plus on-page anchors. No invented legal URLs, and no Security link
 * because there is no /security route to point it at — adding one would be a
 * dead link and an implied security posture we haven't published.
 */

import { Wordmark } from "@/components/voice/wordmark"
import { footer } from "@/lib/voice-content"

export function VoiceFooter() {
  return (
    <footer className="border-t border-border/60 bg-background px-6 py-16">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div className="flex flex-col gap-3">
            <Wordmark />
            <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/70">
              {footer.lockupDescriptor}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:gap-16">
            {footer.columns.map((column) => (
              <nav key={column.heading} aria-label={column.heading}>
                <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground/70">
                  {column.heading}
                </span>
                <ul className="mt-5 flex flex-col gap-3">
                  {column.links.map(([label, href]) => (
                    <li key={href}>
                      <a
                        href={href}
                        className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <p className="mt-14 border-t border-border/60 pt-8 font-mono text-[11px] tracking-[0.12em] text-muted-foreground/70">
          {footer.copyright}
        </p>
      </div>
    </footer>
  )
}
