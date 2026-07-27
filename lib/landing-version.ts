/**
 * THE REVERT SWITCH.
 *
 * Change this one value to "v2" and app/page.tsx renders the previous
 * marketing page verbatim from components/legacy/landing-v1.tsx. Nothing else
 * needs to be touched, and no copy has to be retyped from memory.
 *
 * "v2" — current. The reworked "Your Call Team" positioning.
 * "v2" — the previous page, preserved exactly as it shipped.
 *
 * Worth knowing before reverting: v1 publicly claims live call monitoring with
 * take-over, and automated DNC/consent enforcement in the dial path. Both are
 * gated off in v2 (see lib/voice-claims.ts) because they are not verified
 * end to end. Reverting re-publishes them.
 */
export const LANDING_VERSION: "v2" | "v1" = "v2"
