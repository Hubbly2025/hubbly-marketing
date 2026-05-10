"use client"

import { useRef, useEffect } from "react"
import Link from "next/link"
import gsap from "gsap"

export function TermsOfServiceContent() {
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
            Terms of Service
          </h1>
          
          <p className="font-mono text-sm text-muted-foreground mb-12">
            Last updated: April 21, 2026
          </p>

          <div className="space-y-8 font-mono text-sm text-foreground/80 leading-relaxed">
            <section>
              <h2 className="font-[var(--font-bebas)] text-2xl tracking-tight text-foreground mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Hubbly&apos;s autonomous revenue system (&quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use our Service.
              </p>
            </section>

            <section>
              <h2 className="font-[var(--font-bebas)] text-2xl tracking-tight text-foreground mb-4">2. Description of Service</h2>
              <p>
                Hubbly provides an autonomous revenue system that includes lead discovery, outreach automation, voice AI, inbox management, and calendar booking capabilities. The Service is designed for B2B sales teams and operates as a SaaS platform.
              </p>
            </section>

            <section>
              <h2 className="font-[var(--font-bebas)] text-2xl tracking-tight text-foreground mb-4">3. Account Registration</h2>
              <p className="mb-4">To use our Service, you must:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Be at least 18 years of age</li>
                <li>Have the authority to bind your organization to these terms</li>
              </ul>
            </section>

            <section>
              <h2 className="font-[var(--font-bebas)] text-2xl tracking-tight text-foreground mb-4">4. Acceptable Use</h2>
              <p className="mb-4">You agree not to use the Service to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violate any applicable laws or regulations including CAN-SPAM, TCPA, and GDPR</li>
                <li>Send unsolicited communications to individuals who have opted out</li>
                <li>Transmit malicious code or interfere with the Service</li>
                <li>Impersonate others or misrepresent your affiliation</li>
                <li>Collect data without proper consent</li>
              </ul>
            </section>

            <section>
              <h2 className="font-[var(--font-bebas)] text-2xl tracking-tight text-foreground mb-4">5. TCPA Compliance</h2>
              <p>
                When using our voice AI and calling features, you are responsible for ensuring compliance with the Telephone Consumer Protection Act (TCPA) and all applicable telemarketing regulations. This includes obtaining proper consent before initiating automated calls and maintaining do-not-call lists.
              </p>
            </section>

            <section>
              <h2 className="font-[var(--font-bebas)] text-2xl tracking-tight text-foreground mb-4">6. Billing and Payment</h2>
              <p className="mb-4">Our Service operates on a usage-based pricing model:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Leads are charged per verified lead delivered to your pipeline</li>
                <li>Voice minutes are charged based on actual usage</li>
                <li>Subscription fees are billed in advance on a monthly basis</li>
                <li>All fees are non-refundable unless otherwise stated</li>
              </ul>
            </section>

            <section>
              <h2 className="font-[var(--font-bebas)] text-2xl tracking-tight text-foreground mb-4">7. Intellectual Property</h2>
              <p>
                The Service and its original content, features, and functionality are owned by Hubbly and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="font-[var(--font-bebas)] text-2xl tracking-tight text-foreground mb-4">8. Limitation of Liability</h2>
              <p>
                Hubbly shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service. Our total liability shall not exceed the amount paid by you in the twelve months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="font-[var(--font-bebas)] text-2xl tracking-tight text-foreground mb-4">9. Termination</h2>
              <p>
                We may terminate or suspend your account at any time for violations of these Terms. Upon termination, your right to use the Service will immediately cease. You may cancel your subscription at any time through your account settings.
              </p>
            </section>

            <section>
              <h2 className="font-[var(--font-bebas)] text-2xl tracking-tight text-foreground mb-4">10. Governing Law</h2>
              <p>
                These Terms shall be governed by the laws of the State of Texas, without regard to its conflict of law provisions. Any disputes shall be resolved in the courts of Travis County, Texas.
              </p>
            </section>

            <section>
              <h2 className="font-[var(--font-bebas)] text-2xl tracking-tight text-foreground mb-4">11. Contact</h2>
              <p>
                For questions about these Terms of Service, please contact us at:
              </p>
              <address className="mt-4 p-4 border border-border/40 bg-card/30 not-italic">
                <p className="font-semibold">The Hubbly Corporation</p>
                <p>2021 Guadalupe St, Office</p>
                <p>Austin, TX 78705</p>
                <p className="mt-2">Email: legal@hubbly.io</p>
              </address>
            </section>
          </div>

          <footer className="mt-16 pt-8 border-t border-border/30">
            <p className="font-mono text-xs text-muted-foreground">
              These terms of service are a placeholder and should be reviewed by legal counsel before launch.
            </p>
          </footer>
        </article>
      </div>
    </main>
  )
}
