"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export function StickyHeader({ withTicker = false }: { withTicker?: boolean }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : ""
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileMenuOpen(false)
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [mobileMenuOpen])

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
      style={{ top: withTicker && !isScrolled ? "2.5rem" : "0" }}
      className={cn(
        "fixed left-0 right-0 z-50 transition-all duration-300",
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
            HUBBLY<span className="text-accent tracking-normal -ml-1">.io</span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-5 lg:gap-7">
            <a
              href="/autopilot"
              className="font-mono text-sm font-semibold uppercase tracking-wider text-rank hover:opacity-80 transition-opacity"
            >
              Rank
            </a>
            <a
              href="/signal"
              className="font-mono text-sm font-semibold uppercase tracking-wider text-signal hover:opacity-80 transition-opacity"
            >
              Signal
            </a>
            <a
              href="/spy"
              className="font-mono text-sm font-semibold uppercase tracking-wider text-accent hover:opacity-80 transition-opacity"
            >
              Spy
            </a>
            <a
              href="/send"
              className="font-mono text-sm font-semibold uppercase tracking-wider text-send hover:opacity-80 transition-opacity"
            >
              Send
            </a>
            <a
              href="/voice"
              className="font-mono text-sm font-semibold uppercase tracking-wider text-voice hover:opacity-80 transition-opacity"
            >
              Voice
            </a>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="font-mono text-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              How it works
            </button>
            <button
              onClick={() => scrollToSection("audit")}
              className="font-mono text-sm uppercase tracking-wider bg-accent text-background px-4 py-2 hover:bg-accent/90 transition-colors"
            >
              Free audit
            </button>
          </div>

          {/* Mobile CTA + menu toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <a
              href="/#audit"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center min-h-[40px] font-mono text-[11px] uppercase tracking-widest bg-accent text-background px-4 py-2 hover:bg-accent/90 transition-colors"
            >
              Free audit
            </a>
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              className="inline-flex h-10 w-10 items-center justify-center text-foreground"
            >
              <span className="relative block h-4 w-5">
                <span
                  className={cn(
                    "absolute left-0 block h-0.5 w-5 bg-current transition-all duration-300",
                    mobileMenuOpen ? "top-1.5 rotate-45" : "top-0",
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 top-1.5 block h-0.5 w-5 bg-current transition-all duration-300",
                    mobileMenuOpen ? "opacity-0" : "opacity-100",
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 block h-0.5 w-5 bg-current transition-all duration-300",
                    mobileMenuOpen ? "top-1.5 -rotate-45" : "top-3",
                  )}
                />
              </span>
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile menu panel */}
      <div
        className={cn(
          "md:hidden overflow-hidden border-t border-border/30 bg-background/95 backdrop-blur-md transition-all duration-300",
          mobileMenuOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0 pointer-events-none border-t-0",
        )}
      >
        <div className="flex flex-col px-4 py-4">
          {[
            { label: "Rank", href: "/autopilot", className: "text-rank" },
            { label: "Signal", href: "/signal", className: "text-signal" },
            { label: "Spy", href: "/spy", className: "text-accent" },
            { label: "Send", href: "/send", className: "text-send" },
            { label: "Voice", href: "/voice", className: "text-voice" },
            { label: "How it works", href: "/#how-it-works", className: "text-muted-foreground" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "border-b border-border/20 py-4 font-mono text-sm uppercase tracking-widest transition-opacity hover:opacity-80",
                item.className,
              )}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </header>
  )
}
