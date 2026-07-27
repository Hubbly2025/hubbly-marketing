/**
 * CLAIM REGISTRY.
 *
 * A marketing claim ships only when the production path behind it is verified
 * end to end. Not when a provider offers the capability, and not when a UI
 * mockup for it exists.
 *
 * Everything here is false by default. Flip a flag to true only after
 * engineering confirms the full path works, and the copy and section wired to
 * that key appear automatically. Nothing in this file is customer-facing.
 *
 * Two of these were live on the previous page and are switched off here:
 *   liveMonitoring        — "listen in and take over mid-conversation"
 *   complianceEnforcement — calling windows, DNC lists, consent gating
 * Both are real product intentions, but neither is verified, and the second is
 * a legal claim. They stay dark until they are true.
 */
export const voiceClaims = {
  /** Human barge-in / listen-in on a live call. */
  liveMonitoring: false,
  /** Automated DNC, consent, and calling-window enforcement in the dial path. */
  complianceEnforcement: false,
  /** Live warm transfer to a person mid-call. */
  warmTransfer: false,
  /** Answering inbound calls. */
  inboundCalling: false,
  /** SMS and email follow-up alongside calling. */
  multiChannelFollowUp: false,
  /** Naming specific CRM / calendar vendors as shipped integrations. */
  specificIntegrations: false,
  /** Published response-time or speed guarantees. */
  responseTimeGuarantee: false,
  /** Customer quotes, revenue figures, conversion rates. */
  customerProof: false,
} as const

export type VoiceClaimKey = keyof typeof voiceClaims

/** True when an item carries no claim key, or carries one that is verified. */
export function claimAllowed(claim?: VoiceClaimKey): boolean {
  return claim === undefined || voiceClaims[claim]
}

/** Filter any list of content items down to what is currently publishable. */
export function allowedItems<T extends { claim?: VoiceClaimKey }>(items: readonly T[]): T[] {
  return items.filter((item) => claimAllowed(item.claim))
}
