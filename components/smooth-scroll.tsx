"use client"

import type React from "react"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

// Height of the sticky header so anchored sections aren't hidden beneath it.
const HEADER_OFFSET = 88

/**
 * Native-scroll provider.
 *
 * We intentionally do NOT hijack the wheel/trackpad (no Lenis / smooth-wheel).
 * Hijacked scrolling made the page feel "stuck", broke expected scroll physics
 * for keyboard / trackpad / mobile users, and ignored programmatic scrolling.
 *
 * This component now only handles in-page anchor navigation (e.g. "#audit")
 * using the browser's native smooth scroll, with an offset for the fixed header.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const scrollToHash = (hash: string, immediate = false) => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: immediate ? "auto" : "smooth" })
      return
    }
    const target = document.getElementById(hash)
    if (!target) return
    const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
    window.scrollTo({ top, behavior: immediate ? "auto" : "smooth" })
  }

  // On route change, jump to the current target (or top) without animation.
  useEffect(() => {
    const hash = window.location.hash.replace("#", "")
    const timeout = window.setTimeout(() => scrollToHash(hash, true), 80)
    return () => window.clearTimeout(timeout)
  }, [pathname])

  // Smoothly scroll when the hash changes during navigation on the same page.
  useEffect(() => {
    const handleHashChange = () => {
      scrollToHash(window.location.hash.replace("#", ""))
    }
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  return <>{children}</>
}
