import type { Metadata } from "next"
import { SignalExperience } from "@/components/signal/signal-experience"
import LazyDemo from "@/components/lazy-demo"

export const metadata: Metadata = {
  title: "Hubbly Signal — We already saw you.",
  description:
    "Signal identifies the buyers behind your anonymous traffic and feeds an engine that acts on what they search. This page demonstrates it on you.",
  alternates: { canonical: "https://www.hubblysignal.io/" },
}

export default function SignalPage() {
  return (
    <>
      <SignalExperience />
      <section className="px-4 py-24 md:py-32">
        <div className="mx-auto w-full max-w-[1400px]">
          <h2 className="mb-6 font-[var(--font-bebas)] text-4xl leading-[1.05] tracking-tight text-accent md:mb-8 md:text-6xl">
            See each part run
          </h2>
          <div className="px-2 md:px-4">
            <LazyDemo
              src="/demos/hubbly-agent-demos.html"
              title="Hubbly system demos"
              aspect={null}
              className="h-[min(80vh,860px)]"
            />
          </div>
        </div>
      </section>
    </>
  )
}
