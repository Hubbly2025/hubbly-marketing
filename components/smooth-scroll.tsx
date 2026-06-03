"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import Lenis from "lenis"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const lenisRef = useRef<Lenis | null>(null)
  const rafRef = useRef<((time: number) => void) | null>(null)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
    })

    lenisRef.current = lenis

    // Connect Lenis to GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update)

    const raf = (time: number) => {
      lenis.raf(time * 1000)
    }

    rafRef.current = raf
    gsap.ticker.add(raf)

    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.destroy()
      if (rafRef.current) {
        gsap.ticker.remove(rafRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const scrollToCurrentTarget = () => {
      const hash = window.location.hash.replace("#", "")

      if (!hash) {
        lenisRef.current?.scrollTo(0, { immediate: true })
        window.scrollTo(0, 0)
        return
      }

      const target = document.getElementById(hash)
      if (target) {
        lenisRef.current?.scrollTo(target, { offset: 0 })
      }
    }

    const timeout = window.setTimeout(scrollToCurrentTarget, 80)

    return () => window.clearTimeout(timeout)
  }, [pathname])

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "")
      const target = hash ? document.getElementById(hash) : null

      if (target) {
        lenisRef.current?.scrollTo(target, { offset: 0 })
      } else if (!hash) {
        lenisRef.current?.scrollTo(0)
      }
    }

    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  return <>{children}</>
}
