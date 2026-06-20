"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export function StickyHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Show/hide based on scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      
      // Add background after scrolling
      setIsScrolled(currentScrollY > 50)
      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  const goHome = () => {
    const hero = document.getElementById("hero")
    if (window.location.pathname === "/" && hero) {
      hero.scrollIntoView({ behavior: "smooth" })
    } else {
      window.location.href = "/"
    }
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-background/90 backdrop-blur-md border-b border-border/30" : "bg-transparent",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 md:pl-24 md:pr-6">
        <nav className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <button 
            onClick={goHome}
            aria-label="Go to home page"
            className="font-mono text-sm md:text-base font-bold tracking-wider text-foreground hover:text-accent transition-colors"
          >
            HUBBLY<span className="text-accent">.</span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <a
              href="/autopilot"
              className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              SEO
            </a>
            <a
              href="/signal"
              className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Signal
            </a>
            <a
              href="/voice"
              className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Voice
            </a>
            <a
              href="/send"
              className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Send
            </a>
            <a
              href="/architecture"
              className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Architecture
            </a>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </button>
            <a
              href="/waitlist"
              className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Join Waitlist
            </a>
            <button
              onClick={() => scrollToSection("audit")}
              className="font-mono text-xs uppercase tracking-widest bg-accent text-background px-4 py-2 hover:bg-accent/90 transition-colors"
            >
              Run Free Audit
            </button>
          </div>

          {/* Mobile CTA */}
          <button
            onClick={() => scrollToSection("audit")}
            className="md:hidden font-mono text-[10px] uppercase tracking-widest bg-accent text-background px-3 py-1.5 hover:bg-accent/90 transition-colors"
          >
            Free Audit
          </button>
        </nav>
      </div>
    </header>
  )
}
