"use client"

/**
 * The primary "BUILD MY CALL TEAM" CTA.
 *
 * Requirement: the button must perform a real action — scroll to the existing
 * website-input section and put keyboard focus into the URL field. No dead
 * modal, no placeholder link.
 *
 * Accessibility decisions:
 *   - It stays a real <a href="#build-my-call-team">, so it works with no JS,
 *     middle-click, and "copy link address", and it is reachable by keyboard
 *     with the browser's own focus ring. Progressive enhancement only.
 *   - The JS handler adds what a bare anchor cannot: moving focus INTO the URL
 *     input, so a keyboard or screen-reader user lands on the field itself
 *     rather than at the top of the section.
 *   - Honours prefers-reduced-motion by jumping instead of smooth-scrolling.
 *     `scroll-behavior: smooth` is set globally, so an explicit "auto" is
 *     required to override it for reduced-motion users.
 *   - preventScroll on focus() stops the browser from fighting our own
 *     scroll animation; we scroll deliberately, then focus without re-jumping.
 *   - The accessible name matches the visible text exactly (no aria-label
 *     override), which is what screen-reader and voice-control users expect.
 */

import type { ReactNode } from "react"

export function BuildCtaLink({
  href,
  children,
  className,
}: {
  href: string
  children: ReactNode
  className?: string
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        // Only intercept in-page anchors; let anything else behave normally.
        if (!href.startsWith("#")) return

        const target = document.querySelector(href)
        if (!target) return // No section found: fall back to default anchor jump.

        event.preventDefault()

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        target.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        })

        const field = target.querySelector<HTMLInputElement>("input[type='url']")
        if (!field) return

        // Focus without scrolling so it does not cancel the animation above.
        // Under reduced motion the jump is instant, so focus immediately.
        if (reduceMotion) {
          field.focus({ preventScroll: true })
          return
        }

        // Wait out the smooth scroll before taking focus.
        window.setTimeout(() => field.focus({ preventScroll: true }), 600)
      }}
    >
      {children}
    </a>
  )
}
