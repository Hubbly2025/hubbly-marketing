import type { Metadata } from "next"
import { SignalExperience } from "@/components/signal/signal-experience"

export const metadata: Metadata = {
  title: "Hubbly Signal — We already saw you.",
  description:
    "Signal identifies the buyers behind your anonymous traffic and feeds an engine that acts on what they search. This page demonstrates it on you.",
  alternates: { canonical: "https://www.hubblysignal.io/" },
}

export default function SignalPage() {
  return <SignalExperience />
}
