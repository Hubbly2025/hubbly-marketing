"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

const navItems = [
  { id: "hero", label: "Home" },
  { id: "proof-strip", label: "Signal" },
  { id: "engine", label: "Engine" },
  { id: "how-it-works", label: "How" },
  { id: "modules", label: "Modules" },
  { id: "why-it-wins", label: "Why" },
  { id: "replacement", label: "Replace" },
  { id: "use-cases", label: "Cases" },
  { id: "proof", label: "Proof" },
  { id: "audit", label: "Start" },
]

export function SideNav() {
  const [activeSection, setActiveSection] = useState("hero")

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { threshold: 0.3 },
    )

    navItems.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <nav 
      className="fixed left-0 top-0 z-50 h-screen w-16 md:w-20 hidden md:flex flex-col justify-center border-r border-border/30 bg-background/80 backdrop-blur-sm"
      aria-label="Page navigation"
    >
      <div className="flex flex-col gap-4 px-4" role="list">
        {navItems.map(({ id, label }) => (
          <button 
            key={id} 
            onClick={() => scrollToSection(id)} 
            className="group relative flex items-center gap-3"
            aria-label={`Navigate to ${label} section`}
            aria-current={activeSection === id ? "true" : undefined}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-all duration-300",
                activeSection === id ? "bg-accent scale-125" : "bg-muted-foreground/40 group-hover:bg-foreground/60",
              )}
              aria-hidden="true"
            />
            <span
              className={cn(
                "absolute left-6 font-mono text-[9px] uppercase tracking-widest opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:left-8 whitespace-nowrap",
                activeSection === id ? "text-accent" : "text-muted-foreground",
              )}
              aria-hidden="true"
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  )
}
