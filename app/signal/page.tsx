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
      {/* DEMO HERO */}
      <section className="px-4 pt-24 pb-4 md:px-8 md:pt-28">
        <div className="mx-auto w-full max-w-[1400px]">
          <LazyDemo
            src="/demos/hubbly-agent-demos.html?demo=signal"
            title="Hubbly Signal demo"
            aspect={null}
            className="h-[min(80vh,860px)]"
          />
        </div>
      </section>

      <SignalExperience />
    </>
  )
}
