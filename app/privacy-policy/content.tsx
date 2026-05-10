"use client"

import { useRef, useEffect } from "react"
import Link from "next/link"
import gsap from "gsap"

export function PrivacyPolicyContent() {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.05, duration: 0.6, ease: "power2.out" }
      )
    }
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <div className="grid-bg fixed inset-0 opacity-30" aria-hidden="true" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-24 md:py-32">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-12"
        >
          ← Back to Home
        </Link>

        <article ref={contentRef}>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent block mb-4">
            Legal
          </span>
          
          <h1 className="font-[var(--font-bebas)] text-4xl md:text-6xl tracking-tight mb-8">
            Privacy Policy
          </h1>
          
          <p className="font-mono text-sm text-muted-foreground mb-12">
            Last updated: April 21, 2026
          </p>

          <div className="space-y-8 font-mono text-sm text-foreground/80 leading-relaxed">
            <section>
              <h2 className="font-[var(--font-bebas)] text-2xl tracking-tight text-foreground mb-4">1. Introduction</h2>
              <p>
                Hubbly (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our autonomous revenue system and related services.
              </p>
            </section>

            <section>
              <h2 className="font-[var(--font-bebas)] text-2xl tracking-tight text-foreground mb-4">2. Information We Collect</h2>
              <p className="mb-4">We may collect information about you in various ways, including:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Personal data you provide directly (name, email, company information)</li>
                <li>Usage data and analytics from your interactions with our platform</li>
                <li>Technical data including IP address, browser type, and device information</li>
                <li>Lead and contact data processed through our system on your behalf</li>
              </ul>
            </section>

            <section>
              <h2 className="font-[var(--font-bebas)] text-2xl tracking-tight text-foreground mb-4">3. How We Use Your Information</h2>
              <p className="mb-4">We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide, operate, and maintain our services</li>
                <li>Improve, personalize, and expand our platform</li>
                <li>Process transactions and send related information</li>
                <li>Communicate with you about updates, support, and marketing</li>
                <li>Monitor and analyze usage and trends</li>
              </ul>
            </section>

            <section>
              <h2 className="font-[var(--font-bebas)] text-2xl tracking-tight text-foreground mb-4">4. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your data. Our infrastructure is hosted on AWS and we maintain SOC 2 compliance. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="font-[var(--font-bebas)] text-2xl tracking-tight text-foreground mb-4">5. GDPR Compliance</h2>
              <p>
                If you are a resident of the European Economic Area (EEA), you have certain data protection rights. We aim to take reasonable steps to allow you to correct, amend, delete, or limit the use of your personal data. You may contact us at privacy@hubbly.io to exercise these rights.
              </p>
            </section>

            <section>
              <h2 className="font-[var(--font-bebas)] text-2xl tracking-tight text-foreground mb-4">6. Data Retention</h2>
              <p>
                We retain your personal data only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
              </p>
            </section>

            <section>
              <h2 className="font-[var(--font-bebas)] text-2xl tracking-tight text-foreground mb-4">7. Third-Party Services</h2>
              <p>
                Our service may contain links to third-party websites or integrate with third-party services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies.
              </p>
            </section>

            <section>
              <h2 className="font-[var(--font-bebas)] text-2xl tracking-tight text-foreground mb-4">8. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <address className="mt-4 p-4 border border-border/40 bg-card/30 not-italic">
                <p className="font-semibold">The Hubbly Corporation</p>
                <p>2021 Guadalupe St, Office</p>
                <p>Austin, TX 78705</p>
                <p className="mt-2">Email: privacy@hubbly.io</p>
              </address>
            </section>
          </div>

          <footer className="mt-16 pt-8 border-t border-border/30">
            <p className="font-mono text-xs text-muted-foreground">
              This privacy policy is a placeholder and should be reviewed by legal counsel before launch.
            </p>
          </footer>
        </article>
      </div>
    </main>
  )
}
