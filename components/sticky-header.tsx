"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

const navLinks = [
  { label: "Product", href: "/#how-it-works" },
  { label: "Architecture", href: "/architecture" },
  { label: "Industries", href: "/#verticals" },
  { label: "Proof", href: "/#proof" },
]

export function StickyHeader() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-background/90 backdrop-blur-md border-b border-border/30" : "bg-transparent",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <nav className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <a
            href="/"
            aria-label="Hubbly home"
            className="font-mono text-sm md:text-base font-bold tracking-wider text-foreground hover:text-accent transition-colors"
          >
            HUBBLY<span className="text-accent">.</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </a>
            ))}
            <a
              href="/#audit"
              className="font-mono text-xs uppercase tracking-widest bg-accent text-background px-4 py-2 hover:bg-accent/90 transition-colors"
            >
              Run Free Audit
            </a>
          </div>

          {/* Mobile actions */}
          <div className="md:hidden flex items-center gap-3">
            <a
              href="/#audit"
              className="font-mono text-[10px] uppercase tracking-widest bg-accent text-background px-3 py-1.5 hover:bg-accent/90 transition-colors"
            >
              Free Audit
            </a>
            <button
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              className="flex flex-col justify-center gap-1.5 p-1.5 text-foreground"
            >
              <span
                className={cn(
                  "block h-px w-5 bg-current transition-transform duration-200",
                  isMenuOpen && "translate-y-[7px] rotate-45"
                )}
              />
              <span
                className={cn(
                  "block h-px w-5 bg-current transition-opacity duration-200",
                  isMenuOpen && "opacity-0"
                )}
              />
              <span
                className={cn(
                  "block h-px w-5 bg-current transition-transform duration-200",
                  isMenuOpen && "-translate-y-[7px] -rotate-45"
                )}
              />
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile menu panel */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border/30 bg-background/95 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors py-3 border-b border-border/20 last:border-b-0"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
