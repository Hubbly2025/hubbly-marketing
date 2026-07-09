// Single source of truth for the visible FAQ (components/faq-section.tsx)
// and the FAQPage JSON-LD (components/structured-data.tsx) — keep them in sync.
import { PRODUCT_COUNT_WORD, PRODUCT_LINES_LIST } from "./products"

// Sentence-initial form of the count word (e.g. "Five").
const PRODUCT_COUNT_WORD_CAP =
  PRODUCT_COUNT_WORD.charAt(0).toUpperCase() + PRODUCT_COUNT_WORD.slice(1)

export const faqs = [
  {
    question: "What is Hubbly?",
    answer:
      `Hubbly is the autonomous revenue operating system for SMBs and mid-market teams. ${PRODUCT_COUNT_WORD_CAP} product lines — ${PRODUCT_LINES_LIST} — run research, content, outreach, and calling from one shared buyer context, on autopilot by default with opt-in approval gates.`,
  },
  {
    question: "What is an autonomous revenue operating system?",
    answer:
      "One system that runs the revenue motion end to end — it learns your market, ranks your content, finds in-market buyers, runs outreach and calls, and books the meetings. Every part reads from and writes to the same shared buyer context, so nothing is lost between tools.",
  },
  {
    question: "How is Hubbly different from an AI SDR tool?",
    answer:
      `An AI SDR tool automates one slice of outbound. Hubbly is broader: ${PRODUCT_COUNT_WORD} product lines — ${PRODUCT_LINES_LIST} — cover research, content, outreach, and calling, coordinated through one shared buyer context rather than a single outbound layer.`,
  },
  {
    question: "Does Hubbly replace my CRM?",
    answer:
      "No. Hubbly integrates with existing systems or replaces parts of the stack over time, depending on how your team wants to adopt it. What it replaces is the disconnected growth stack — data vendors, enrichment tools, sequencing products, dialers, and booking tools — not your CRM.",
  },
  {
    question: "How do approval gates work?",
    answer:
      "Hubbly runs on autopilot by default with safety rails always on — snapshot before every change, verify after every publish, auto-rollback on regression. If you prefer to review before anything goes live, approval gates are opt-in: a single toggle.",
  },
  {
    question: "How fast can I launch?",
    answer:
      "Drop your website in and Hubbly starts by learning your market — your free audit is the first pass. From there it builds the plan: your first pages, your ICP, and the launch sequence Hubbly would run. You leave the strategy call with that plan whether you buy or not.",
  },
  {
    question: "Does Hubbly support industry-specific workflows?",
    answer:
      "Yes. The core engine stays the same. The language, workflows, and compliance logic adapt to your market.",
  },
  {
    question: "Does Hubbly support international and multilingual workflows?",
    answer:
      "Yes. Hubbly supports international teams and operates across 74 languages for outreach, voice, follow-up, and reporting.",
  },
]
