import type { Metadata } from "next"
import Link from "next/link"
import { ContactForm } from "@/components/contact-form"

export const metadata: Metadata = {
  title: "Contact Hubbly — Talk to the Team",
  description:
    "Get in touch with Hubbly. Talk to sales, request a demo, ask about integrations, or get product support for the autonomous revenue OS.",
  alternates: { canonical: "https://hubbly.io/contact" },
}

const channels = [
  { label: "General", value: "hello@hubbly.io", href: "mailto:hello@hubbly.io" },
  { label: "Book a demo", value: "Schedule a live walkthrough", href: "/demo" },
  { label: "Run a free audit", value: "See what Hubbly builds for you", href: "/#audit" },
]

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 md:py-32">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-12"
        >
          ← Back to Home
        </Link>

        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent block mb-4">Contact</span>

        <h1 className="font-[var(--font-bebas)] text-4xl md:text-6xl lg:text-7xl tracking-tight mb-6 text-balance">
          Let's talk revenue.
        </h1>

        <p className="font-mono text-sm md:text-base text-muted-foreground mb-16 max-w-3xl leading-relaxed">
          Whether you want a demo, have a question about integrations, or just want to see what an autonomous revenue OS
          could do for your team — drop us a line. We respond within one business day.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12">
          {/* Form */}
          <div className="lg:col-span-2 border border-border/40 bg-card/30 p-6 md:p-8">
            <ContactForm />
          </div>

          {/* Channels */}
          <aside className="space-y-8">
            <div>
              <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-5">Other ways to reach us</h2>
              <ul className="space-y-4">
                {channels.map((channel) => (
                  <li key={channel.label} className="border-b border-border/20 pb-4">
                    <span className="block font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-1">
                      {channel.label}
                    </span>
                    <a
                      href={channel.href}
                      className="font-mono text-sm text-foreground hover:text-accent transition-colors"
                    >
                      {channel.value}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">Where we are</h2>
              <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                Austin, Texas
                <br />
                Operating worldwide, remote-first.
              </p>
            </div>

            <div>
              <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">Follow along</h2>
              <div className="flex gap-4">
                <a
                  href="https://twitter.com/hubblyio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Twitter
                </a>
                <a
                  href="https://www.linkedin.com/company/hubbly-io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  LinkedIn
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
