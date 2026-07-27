/**
 * THE SINGLE SOURCE OF PAGE COPY.
 *
 * Every string on the marketing page lives here rather than being scattered as
 * literals across components, so a copy change is a one-file edit and the whole
 * page's claims can be reviewed in one read.
 *
 * Locked by positioning and not to be reworded casually:
 *   product name  — "Hubbly Voice" (never "Hubbly Call Team")
 *   descriptor    — "Your Call Team"
 *   core promise  — "Hubbly Voice handles the conversation. Hubbly OS runs the operation."
 *
 * What the customer is buying is a call team, not a voice model. Do not lead
 * with "AI voice agent", "conversational AI", "autonomous voice operating
 * system", LLMs, speech synthesis, telephony, or provider names. Those may sit
 * underneath the product; they are not the thing being sold.
 *
 * Items carrying a `claim` key are hidden until that key is verified in
 * lib/voice-claims.ts.
 */

import type { VoiceClaimKey } from "@/lib/voice-claims"

export interface VoiceRole {
  id: string
  index: string
  name: string
  description: string
  category: string
  claim?: VoiceClaimKey
}

export interface VoiceSequenceStep {
  id: string
  index: string
  title: string
  description: string
  claim?: VoiceClaimKey
}

export interface VoiceFaqItem {
  id: string
  question: string
  answer: string
  claim?: VoiceClaimKey
}

export interface VoiceStep {
  index: string
  title: string
  description: string
}

export const voiceBrand = {
  name: "Hubbly Voice",
  descriptor: "Your Call Team",
  promise: "Hubbly Voice handles the conversation. Hubbly OS runs the operation.",
} as const

/** Outcome-led, and deliberately free of language counts, compliance
 *  guarantees, and provider names. */
export const tickerItems = [
  "WEBSITE IN",
  "BUSINESS LEARNED",
  "LEADS CONNECTED",
  "SPEED-TO-LEAD",
  "QUALIFICATION",
  "FOLLOW-UP",
  "APPOINTMENT BOOKING",
  "CALL REVIEW",
  "CRM SYNC",
  "OUTCOME RECORDED",
] as const

export const navItems = [
  ["HOW IT WORKS", "#how-it-works"],
  ["YOUR CALL TEAM", "#team"],
  ["THE WORKSPACE", "#workspace"],
  ["INTEGRATIONS", "#integrations"],
  ["FAQ", "#faq"],
] as const

export const ctas = {
  primary: "BUILD MY CALL TEAM",
  /**
   * The hero CTA scrolls to the real website-input section rather than jumping
   * straight to /signup, because that section IS the onboarding mechanism: the
   * visitor enters a URL there and the form carries it into /signup. Smooth
   * scroll plus focus into the URL field is handled by BuildCtaLink.
   */
  primaryHref: "#build-my-call-team",
  /** The onboarding form's real destination. */
  signupHref: "/signup",
  secondary: "SEE HOW IT WORKS",
  secondaryHref: "#launch",
  signIn: "SIGN IN",
  signInHref: "/login",
} as const

/**
 * Hero copy is fixed by the positioning brief. Do not reword, shorten, or pad
 * it with extra marketing language.
 *
 * Guardrails baked into these strings:
 *   - The category line reads "THE AUTONOMOUS CALL TEAM" so a first-time
 *     visitor understands this is software, not outsourced human staffing.
 *   - Vocabulary is limited to autonomous / agentic / voice agents / software
 *     agents. "AI" is deliberately not emphasised, and "AI call center",
 *     "virtual call center", "outsourced call center", "robocalling",
 *     "automated dialer", "most advanced", and any human-replacement framing
 *     are barred.
 *   - No performance figures or compliance guarantees. Unverified capabilities
 *     stay gated in lib/voice-claims.ts.
 */
export const hero = {
  /** The centred interpunct is part of the exact approved copy. */
  eyebrow: "HUBBLY VOICE · THE AUTONOMOUS CALL TEAM",
  /**
   * Split in two only to allow a deliberate desktop line break. Below lg the
   * halves sit inline and wrap naturally, so mobile is not forced into a
   * cramped two-line headline.
   */
  headlineLineOne: "Your call team",
  headlineLineTwo: "is ready.",
  /**
   * Blue supporting headline: larger than body copy, clearly subordinate to the
   * H1. The em dash before "automatically" is part of the approved copy, so it
   * is written as an escape to survive any editor normalising the character.
   */
  supporting:
    "Agentic voice agents call every lead, run every follow-up, and book the next step\u2014automatically.",
  body: "Connect your website, CRM, and calendar. Hubbly learns your business and deploys autonomous voice agents that work from your knowledge, rules, scripts, and objectives.",
  microcopy: "Software agents. Human control.",
  /**
   * Software-operation signal for the hero interface panel. It reinforces that
   * active software agents are running, which is why it belongs to the
   * interface chrome rather than to the hero prose.
   */
  feedStatus: "AUTONOMOUS TEAM ACTIVE",
  /**
   * Interface content, not hero copy — the automatic motion of one lead.
   * Deliberately a process feed rather than a roster, so it never reads as a
   * human staffing directory or a conventional call-center dashboard.
   */
  workFeed: [
    "NEW LEAD RECEIVED",
    "CALL STARTED AUTOMATICALLY",
    "PROSPECT QUALIFIED",
    "MEETING BOOKED",
    "CRM UPDATED",
  ],
} as const

/** No percentages or customer metrics — these are the jobs, not results. */
export const outcomeCells = [
  { index: "01", label: "CALL NEW LEADS" },
  { index: "02", label: "QUALIFY INTEREST" },
  { index: "03", label: "BOOK MEETINGS" },
  { index: "04", label: "RUN FOLLOW-UP" },
  { index: "05", label: "REACTIVATE PIPELINE" },
  { index: "06", label: "UPDATE EVERY RECORD" },
] as const

export const problem = {
  eyebrow: "THE COST OF DELAY",
  headline: "Your leads are not waiting.",
  body: "Opportunities are lost between the form fill and the first real conversation. Reps call late. Follow-up stops early. Outcomes disappear into notes. Hubbly gives the complete calling motion one owner.",
  oldWay: {
    label: "THE OLD WAY",
    steps: [
      "Lead arrives",
      "Notification sent",
      "Rep queue",
      "Late or missed attempt",
      "Manual notes",
      "No clear next action",
    ],
    support: "More tools. More handoffs. Less accountability.",
  },
  newWay: {
    label: "HUBBLY VOICE",
    steps: [
      "Lead arrives",
      "Call launched",
      "Interest qualified",
      "Meeting booked",
      "Record updated",
      "Next action scheduled",
    ],
    support: "One call team owns the motion from first attempt to real outcome.",
  },
} as const

export const team = {
  eyebrow: "ONE PRODUCT · SPECIALIZED ROLES",
  headline: "A call team built around the job.",
  body: "Deploy the roles you need for the revenue motion you are running. Each role works from the same business context, campaign, contact record, and success definition.",
} as const

/**
 * Six live roles. The three gated ones below them stay hidden until verified —
 * they are listed rather than deleted so the copy is ready when they ship.
 */
export const roles: readonly VoiceRole[] = [
  {
    id: "speed-to-lead",
    index: "01",
    name: "SPEED-TO-LEAD CALLER",
    description: "Calls new leads while intent is still high.",
    category: "NEW INBOUND LEADS",
  },
  {
    id: "qualification",
    index: "02",
    name: "QUALIFICATION SPECIALIST",
    description: "Collects fit, urgency, and required details before your team spends time.",
    category: "QUALIFICATION",
  },
  {
    id: "appointment",
    index: "03",
    name: "APPOINTMENT SETTER",
    description: "Checks the correct calendar and books the next step.",
    category: "BOOKING",
  },
  {
    id: "follow-up",
    index: "04",
    name: "FOLLOW-UP SPECIALIST",
    description: "Works the approved retry cadence until the lead reaches a real outcome.",
    category: "FOLLOW-UP",
  },
  {
    id: "reactivation",
    index: "05",
    name: "REACTIVATION SPECIALIST",
    description: "Reopens old leads, dormant opportunities, and customer lists.",
    category: "PIPELINE REACTIVATION",
  },
  {
    id: "analyst",
    index: "06",
    name: "CALL ANALYST",
    description: "Records the transcript, summary, disposition, objections, and next action.",
    category: "OPERATING DATA",
  },
  {
    id: "inbound",
    index: "07",
    name: "INBOUND RECEPTIONIST",
    description: "Answers inbound calls and routes them to the right outcome.",
    category: "INBOUND",
    claim: "inboundCalling",
  },
  {
    id: "transfer",
    index: "08",
    name: "WARM TRANSFER SPECIALIST",
    description: "Hands a live, qualified caller to a person on your team.",
    category: "LIVE TRANSFER",
    claim: "warmTransfer",
  },
  {
    id: "multichannel",
    index: "09",
    name: "SMS / EMAIL FOLLOW-UP SPECIALIST",
    description: "Continues the approved cadence across message channels.",
    category: "MULTI-CHANNEL",
    claim: "multiChannelFollowUp",
  },
]

export const sequence = {
  eyebrow: "MORE THAN A DIAL",
  headline: "It works the sequence, not just the call.",
  body: "A call is one step. Hubbly manages the attempt, conversation, outcome, next action, and follow-up until the contact reaches a real state.",
} as const

export const sequenceSteps: readonly VoiceSequenceStep[] = [
  {
    id: "enters",
    index: "01",
    title: "LEAD ENTERS",
    description: "A form, file, CRM record, or approved source sends the contact into the campaign.",
  },
  {
    id: "attempt",
    index: "02",
    title: "FIRST ATTEMPT",
    description: "Hubbly places the call according to the campaign's timing and rules.",
  },
  {
    id: "conversation",
    index: "03",
    title: "CONVERSATION",
    description: "The call team uses the approved business context, questions, and objective.",
  },
  {
    id: "qualification",
    index: "04",
    title: "QUALIFICATION",
    description: "Fit, urgency, required details, and objections are captured.",
  },
  {
    id: "next-step",
    index: "05",
    title: "NEXT STEP",
    description: "Hubbly books a meeting, creates a human task, or records the correct outcome.",
  },
  {
    id: "record",
    index: "06",
    title: "RECORD UPDATE",
    description: "Transcript, summary, disposition, fields, owner, and next action stay connected.",
  },
  {
    id: "follow-up",
    index: "07",
    title: "FOLLOW-UP",
    description: "The next approved attempt or task is scheduled based on what actually happened.",
  },
]

export const launch = {
  eyebrow: "FAST SETUP · CONTROLLED LAUNCH",
  headline: "From website to working call team.",
  body: "Hubbly does not start from a blank prompt. It learns the business first, then builds the calling workflow for review.",
} as const

export const launchSteps: readonly VoiceStep[] = [
  {
    index: "01",
    title: "ADD YOUR BUSINESS",
    description: "Enter your website. Hubbly maps the company, offer, buyers, positioning, FAQs, and common objections.",
  },
  {
    index: "02",
    title: "CHOOSE THE OBJECTIVE",
    description: "Select the job: speed-to-lead, qualification, appointment setting, follow-up, or pipeline reactivation.",
  },
  {
    index: "03",
    title: "CONNECT THE OPERATION",
    description: "Add the audience, calendar, CRM or record source, team ownership, and approved calling rules.",
  },
  {
    index: "04",
    title: "REVIEW AND TEST",
    description: "Confirm what Hubbly learned, review the call flow, and run controlled test calls before launch.",
  },
  {
    index: "05",
    title: "GO LIVE",
    description: "Launch the approved campaign and watch every attempt, conversation, booking, and next action from one workspace.",
  },
]

export const workspace = {
  eyebrow: "ONE WORKSPACE",
  headline: "Watch the work. Know what happens next.",
  body: "See who was called, what happened, what was booked, what needs a human, and what the call team will do next.",
  /** Rendered on the mockup itself so nothing reads as real customer data. */
  exampleLabel: "EXAMPLE WORKSPACE",
  tabs: ["CAMPAIGNS", "CONTACTS", "CALLS", "CALENDAR", "ANALYTICS"],
  campaigns: ["New Lead Speed-to-Lead", "Dormant Pipeline Reactivation", "Quote Follow-Up"],
  feed: [
    "Lead received.",
    "Call started.",
    "Connected.",
    "Qualification completed.",
    "Meeting booked.",
    "Human follow-up requested.",
    "Record updated.",
  ],
} as const

export const record = {
  eyebrow: "THE CONVERSATION DOES NOT DISAPPEAR",
  headline: "Every call becomes the next action.",
  body: "Hubbly turns the conversation into a structured operating record so the team does not have to listen, interpret, retype, and remember what happened.",
  support: "The call is not complete when someone hangs up. It is complete when the record and next step are correct.",
  fields: [
    ["CONTACT", "Dana Whitfield"],
    ["CAMPAIGN", "New Lead Speed-to-Lead"],
    ["ATTEMPT", "2 of 8"],
    ["STATUS", "Qualified"],
    ["DISPOSITION", "Meeting booked"],
    ["APPOINTMENT", "Thu 10:30 AM"],
    ["OWNER", "Unassigned"],
    ["NEXT ACTION", "Send recap, then confirm 24h prior"],
    ["WORKFLOW", "v4 · approved"],
  ],
  transcript: [
    ["CALL TEAM", "Hi Dana, this is the Hubbly team calling about the quote request you just submitted."],
    ["DANA", "That was fast. I only filled that in a minute ago."],
    ["CALL TEAM", "Can I check a couple of details so the right person picks this up?"],
  ],
} as const

export const os = {
  eyebrow: "BUILT ON HUBBLY OS",
  headline: "Voice handles the conversation. Hubbly OS runs the operation.",
  body: "Hubbly Voice can run by itself, but it uses the same business context, contacts, campaigns, knowledge, calendar, tasks, and analytics as the rest of Hubbly. Add more Hubbly capabilities later without rebuilding the account or losing the operating history.",
  support: "One workspace. One customer record. One operating history.",
  nodes: [
    { kind: "source", title: "LEAD SOURCE", detail: "" },
    { kind: "os", title: "HUBBLY OS", detail: "Business context · campaign · contact · objective · rules" },
    { kind: "voice", title: "HUBBLY VOICE", detail: "Call · qualify · book · record" },
    { kind: "os", title: "HUBBLY OS", detail: "Calendar · task · pipeline · analytics · next action" },
  ],
} as const

export const integrations = {
  eyebrow: "CONNECT THE OPERATION",
  headline: "Work with the systems you already use.",
  body: "Bring in leads, route bookings, synchronize outcomes, and keep the operating record connected.",
  support: "Hubbly owns the workflow. Infrastructure providers remain replaceable behind the operation.",
  /**
   * Neutral categories, never vendor names. A specific vendor appears only once
   * that integration is genuinely supported in production — gated behind the
   * specificIntegrations claim.
   */
  categories: [
    { name: "CRM", status: "AVAILABLE" },
    { name: "CALENDAR", status: "AVAILABLE" },
    { name: "LEAD FORMS", status: "AVAILABLE" },
    { name: "WEBHOOKS", status: "CONNECTED" },
    { name: "CSV IMPORT", status: "CONNECTED" },
    { name: "PHONE NUMBERS", status: "CONFIGURE" },
  ],
} as const

export const analytics = {
  eyebrow: "OUTCOMES, NOT MINUTES",
  headline: "Measure the work that moves revenue.",
  body: "Track the speed, conversations, qualifications, bookings, follow-up requirements, and pipeline movement created by the call team.",
  exampleLabel: "EXAMPLE DATA",
  /** Labels only. No figures presented as Hubbly's real results. */
  metrics: [
    "MEDIAN SPEED TO LEAD",
    "CONTACTS ATTEMPTED",
    "CONNECTION RATE",
    "QUALIFIED CONVERSATIONS",
    "MEETINGS BOOKED",
    "HUMAN FOLLOW-UP REQUIRED",
    "CAMPAIGN OUTCOMES",
    "PIPELINE CREATED",
  ],
} as const

export const faqItems: readonly VoiceFaqItem[] = [
  {
    id: "what",
    question: "What is Hubbly Voice?",
    answer:
      "Hubbly Voice is your call team inside Hubbly OS. It calls leads, qualifies interest, works the approved follow-up cadence, books meetings, and records every outcome.",
  },
  {
    id: "dialer",
    question: "Is Hubbly Voice just a dialer?",
    answer:
      "No. A dialer places calls. Hubbly manages the campaign, conversation, outcome, record update, and next action around the call.",
  },
  {
    id: "standalone",
    question: "Can I use Hubbly Voice without buying the rest of Hubbly?",
    answer:
      "Yes. Hubbly Voice can be launched as a standalone call-team product. It still runs on the shared Hubbly workspace so additional Hubbly capabilities can be added later without rebuilding the operation.",
  },
  {
    id: "learn",
    question: "How does Hubbly learn my business?",
    answer:
      "Start with your website. Hubbly maps the company, offer, buyers, FAQs, positioning, and common objections. You review and correct the business context before launch.",
  },
  {
    id: "after",
    question: "What happens after each call?",
    answer:
      "Hubbly stores the transcript, summary, disposition, qualification details, booking, ownership, and next action in the connected contact and campaign record.",
  },
  {
    id: "booking",
    question: "Can Hubbly book meetings?",
    answer:
      "Yes. The call team can use the connected calendar and approved booking rules to schedule the next step.",
  },
  {
    id: "review",
    question: "Can I review the calls?",
    answer:
      "Yes. The workspace is designed to show call history, recordings, transcripts, summaries, outcomes, and follow-up requirements.",
  },
  {
    id: "launch",
    question: "How quickly can I launch?",
    answer:
      "Launch time depends on the campaign, audience, integrations, rules, and testing required. Hubbly guides the setup from business intake through a controlled test before production calling.",
  },
  {
    id: "monitoring",
    question: "Can I listen to a call while it is happening?",
    answer:
      "Yes. The live monitor shows calls in progress, lets you listen in, and lets you take over mid-conversation.",
    claim: "liveMonitoring",
  },
  {
    id: "compliance",
    question: "How do you handle calling rules and Do-Not-Call?",
    answer:
      "Calling windows are enforced in the contact's local time, Do-Not-Call lists are managed in your settings, and consent can be required before dialing.",
    claim: "complianceEnforcement",
  },
]

/**
 * Destination for the hero CTA. The heading supports the new positioning while
 * the section keeps the website-input mechanism.
 *
 * "Drop your website in" is deliberately NOT used as a headline anywhere: it is
 * an onboarding action, not the product's value proposition.
 */
export const finalCta = {
  eyebrow: "THE AUTONOMOUS CALL TEAM",
  headline: "Build your autonomous call team.",
  body: "Enter your website and Hubbly will begin learning your business, offers, customers, and workflows.",
  support: voiceBrand.promise,
} as const

export const footer = {
  lockupDescriptor: "YOUR CALL TEAM",
  /** Existing project routes only. No invented legal URLs. */
  columns: [
    {
      heading: "PRODUCT",
      links: [
        ["How It Works", "#how-it-works"],
        ["Your Call Team", "#team"],
        ["Workspace", "#workspace"],
        ["Integrations", "#integrations"],
        ["FAQ", "#faq"],
      ],
    },
    {
      heading: "HUBBLY",
      links: [
        ["Hubbly OS", "#hubbly-os"],
        ["Sign In", "/login"],
        ["Get Started", "/signup"],
      ],
    },
    {
      heading: "LEGAL",
      links: [
        ["Privacy", "/privacy"],
        ["Terms", "/terms"],
      ],
    },
  ],
  copyright: "© 2026 Hubbly Inc. All rights reserved.",
} as const

/** Reusable block for the main Hubbly OS marketing homepage. */
export const homepageInsert = {
  eyebrow: "HUBBLY VOICE",
  headline: "Your call team is ready.",
  body: "Calls new leads, qualifies interest, works follow-up, books meetings, and updates every record from the same operating context as the rest of Hubbly.",
  cta: "MEET HUBBLY VOICE",
  ctaHref: "/",
  support: "Voice handles the conversation. Hubbly OS runs the operation.",
  feed: ["LEAD RECEIVED", "CALL CONNECTED", "QUALIFIED", "MEETING BOOKED", "RECORD UPDATED"],
} as const
