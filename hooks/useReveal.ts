"use client"

import { useEffect, useRef } from "react"

/**
 * Adds an "in" class to the referenced element when it scrolls into view.
 * Child elements with the `rv` class will then animate in (see v2-tokens.css).
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("in")
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in")
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return ref
}
