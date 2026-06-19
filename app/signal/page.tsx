import type { Metadata } from "next"
import SignalPage from "@/components/v2/signal-page"

export const metadata: Metadata = {
  title: "Hubbly Signal — We already saw you.",
  description:
    "Signal identifies the buyers behind your anonymous traffic and feeds an engine that acts on what they search. This page demonstrates it on you.",
  robots: { index: false, follow: false },
}

export default function Page() {
  return <SignalPage />
}
