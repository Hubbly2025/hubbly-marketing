"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export function FloatingCTA() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past the how-it-works section
      const howItWorksSection = document.getElementById("how-it-works")
      if (howItWorksSection) {
        const rect = howItWorksSection.getBoundingClientRect()
        // Show when how-it-works section is scrolled past (its bottom is above viewport)
        setIsVisible(rect.bottom < 0)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll() // Check on mount
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToAudit = () => {
    const element = document.getElementById("audit")
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <button
      onClick={scrollToAudit}
      className={cn(
        "fixed bottom-6 right-6 z-50 font-mono text-xs uppercase tracking-widest bg-accent text-background px-5 py-3 shadow-lg hover:bg-accent/90 transition-all duration-300",
        "flex items-center gap-2",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0 pointer-events-none"
      )}
      aria-label="Run Free Audit"
    >
      <span>Free Audit</span>
      <svg 
        className="w-3 h-3" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </button>
  )
}
