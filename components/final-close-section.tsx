"use client"

import { useRef, useEffect, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export function FinalCloseSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [url, setUrl] = useState("")

  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      if (contentRef.current) {
        gsap.from(contentRef.current, {
          y: 60,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: contentRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        })
      }
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission - redirect to signup with URL param
    if (url) {
      window.location.href = `#pricing?url=${encodeURIComponent(url)}`
    }
  }

  return (
    <section ref={sectionRef} id="close" className="relative py-24 md:py-40 px-4 md:pl-28 md:pr-12 border-t border-border/30 bg-card/20">
      <div ref={contentRef} className="max-w-4xl mx-auto text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-4 md:mb-8 block">10 / RUN IT</span>
        
        <h2 className="font-[var(--font-bebas)] text-3xl md:text-6xl lg:text-7xl tracking-tight mb-4 md:mb-8 text-balance">
          See what your revenue engine should look like.
        </h2>

        <p className="max-w-xl mx-auto font-mono text-xs md:text-sm text-muted-foreground mb-8 md:mb-12">
          Run an audit on your current website, offer, and outbound motion, then see how Hubbly would structure research, targeting, and execution.
        </p>

        {/* URL Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch justify-center gap-3 mb-6 md:mb-10 max-w-2xl mx-auto">
          <div className="relative flex-1 w-full">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="your-website.com"
              className="w-full bg-background border border-border/50 px-4 md:px-5 py-4 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-200 min-h-[52px]"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-accent px-6 md:px-8 py-4 font-mono text-xs uppercase tracking-widest text-background hover:bg-accent/90 transition-all duration-200 whitespace-nowrap min-h-[52px] active:scale-[0.98]"
          >
            Run My Audit
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </button>
        </form>

        {/* Secondary Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 mb-12 md:mb-20">
          <span className="font-mono text-xs text-muted-foreground">or</span>
          <a
            href="https://cal.com/hubbly/demo"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs uppercase tracking-widest text-foreground hover:text-accent transition-colors duration-200 py-2"
          >
            BOOK A DEMO →
          </a>
          <span className="text-muted-foreground/40 hidden sm:inline">·</span>
          <a
            href="#how-it-works"
            className="font-mono text-xs uppercase tracking-widest text-foreground hover:text-accent transition-colors duration-200 py-2"
          >
            SEE THE SYSTEM
          </a>
        </div>

        {/* Bottom tagline */}
        <p className="font-mono text-lg md:text-xl tracking-[0.3em] text-muted-foreground/30 uppercase">
          THE OPERATING SYSTEM FOR REVENUE
        </p>
      </div>
    </section>
  )
}
