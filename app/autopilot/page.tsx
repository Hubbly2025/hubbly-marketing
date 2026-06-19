import type { Metadata } from "next"
import AutopilotPage from "@/components/v2/autopilot-page"

export const metadata: Metadata = {
  title: "Hubbly Autopilot — Your SEO team, running itself",
  description:
    "Autopilot turns what your buyers search into pages you own — content, technical fixes, schema, and AI-answer placement. Approval-gated, snapshotted, reversible.",
  alternates: { canonical: "/autopilot" },
  openGraph: {
    type: "website",
    url: "/autopilot",
    title: "Hubbly Autopilot — Your SEO team, running itself",
    description:
      "Autopilot turns what your buyers search into pages you own — content, technical fixes, schema, and AI-answer placement. Approval-gated, snapshotted, reversible.",
  },
}

export default function Page() {
  return <AutopilotPage />
}
