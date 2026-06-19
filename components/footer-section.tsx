"use client"

import { useRef, useEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export function FooterSection() {
  const footerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!footerRef.current) return

    const ctx = gsap.context(() => {
      gsap.from(footerRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: footerRef.current,
          start: "top 95%",
          toggleActions: "play none none reverse",
        },
      })
    }, footerRef)

    return () => ctx.revert()
  }, [])

  return (
    <footer ref={footerRef} className="py-16 md:py-20 px-4 md:pl-28 md:pr-12 border-t border-border/30 bg-card/10">
      {/* Links grid - 5 columns */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-10 mb-12 md:mb-16">
        <div>
          <h4 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-5">Product</h4>
          <ul className="space-y-3">
            <li><a href="/architecture" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Architecture</a></li>
            <li><a href="#how-it-works" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">How Hubbly works</a></li>
            <li><a href="/platform" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Platform</a></li>
            <li><a href="#faq" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">FAQ</a></li>
            <li><a href="/demo" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Get pricing</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-5">Use Cases</h4>
          <ul className="space-y-3">
            <li><a href="/use-cases/ai-sales-automation" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">AI sales automation</a></li>
            <li><a href="/use-cases/autonomous-outbound" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Autonomous outbound</a></li>
            <li><a href="/use-cases/lead-generation-automation" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Lead generation</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-5">Industries</h4>
          <ul className="space-y-3">
            <li><a href="/industries/insurance" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Insurance</a></li>
            <li><a href="/industries/mortgage" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Mortgage</a></li>
            <li><a href="/industries/agencies" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Agencies</a></li>
            <li><a href="/industries/financial-services" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Financial services</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-5">Company</h4>
          <ul className="space-y-3">
            <li><a href="/about" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">About</a></li>
            <li><a href="/integrations" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Integrations</a></li>
            <li><a href="/contact" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Contact us</a></li>
            <li><a href="/demo" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Book a demo</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-5">Legal</h4>
          <ul className="space-y-3">
            <li><a href="/privacy-policy" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Privacy policy</a></li>
            <li><a href="/terms-of-service" className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Terms of service</a></li>
          </ul>
        </div>
      </div>

      {/* Compliance badges */}
      <div className="flex flex-wrap items-center gap-6 mb-8 pb-8 border-b border-border/20">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[10px]">✓</span>
          <span className="font-mono text-xs text-muted-foreground">SOC 2 Compliant</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[10px]">✓</span>
          <span className="font-mono text-xs text-muted-foreground">GDPR Ready</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[10px]">✓</span>
          <span className="font-mono text-xs text-muted-foreground">AWS Infrastructure</span>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <span className="font-mono text-sm text-muted-foreground">Austin, Texas</span>
          <span className="hidden sm:inline text-muted-foreground/40">|</span>
          <span className="font-mono text-sm text-muted-foreground">Hubbly is the autonomous revenue operating system for modern growth teams.</span>
        </div>
        <p className="font-mono text-sm text-muted-foreground">
          © 2026 Hubbly. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
