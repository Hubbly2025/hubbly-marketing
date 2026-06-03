"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"

export default function WaitlistConfirmationPage() {
  return (
    <Suspense fallback={<ConfirmationContent company="your company" />}>
      <WaitlistConfirmationContent />
    </Suspense>
  )
}

function WaitlistConfirmationContent() {
  const params = useSearchParams()
  const company = params.get("company") || "your company"

  return <ConfirmationContent company={company} />
}

function ConfirmationContent({ company }: { company: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-6 py-12 text-white">
      <section className="max-w-2xl border border-white/10 bg-white p-8 text-center text-[#0A0A0A] shadow-2xl md:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FF6B35]/15 text-[#FF6B35]">
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-6 font-[var(--font-bebas)] text-5xl leading-none tracking-tight">You're on the waitlist.</h1>
        <p className="mt-4 text-lg leading-8 text-black/65">
          We received the request for {company}. Your complete revenue analysis is being prepared and we'll email next steps.
        </p>
        <div className="mt-8 border border-[#FF6B35]/25 bg-[#FF6B35]/10 p-5 text-left">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#B9471C]">What happens next</p>
          <ol className="mt-4 space-y-3 text-sm text-black/70">
            <li>1. Complete revenue audit delivered to your inbox.</li>
            <li>2. Fit review and strategy session if timing lines up.</li>
            <li>3. Private beta access as slots open.</li>
          </ol>
        </div>
        <a href="/" className="mt-8 inline-flex min-h-12 items-center justify-center bg-[#FF6B35] px-6 font-mono text-xs font-semibold uppercase tracking-widest text-[#0A0A0A] transition-opacity hover:opacity-90">
          Back to Hubbly.io
        </a>
        <p className="mt-5 text-sm text-black/50">
          Questions? Email <a className="text-[#B9471C] underline" href="mailto:hello@hubbly.io">hello@hubbly.io</a>.
        </p>
      </section>
    </main>
  )
}
