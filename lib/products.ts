// Single source of truth for the product-line roster and count.
//
// When a new line launches (e.g. AdPilot: five -> six), update PRODUCT_LINES and
// PRODUCT_COUNT_WORD here. That fixes every place that imports from this file:
// the five product-page JSON-LD descriptions (app/{signal,rank,send,voice,spy}/page.tsx)
// and the two count-bearing FAQ answers (lib/faqs.ts).
//
// Two static files CANNOT import this and must be hand-edited on the same bump:
//   - public/llms.txt        (## Product lines + the summary line)
//   - public/llms-full.txt   (## Product lines + the summary line)
export const PRODUCT_LINES = ["Signal", "Rank", "Send", "Voice", "Spy"] as const

// Word form of PRODUCT_LINES.length. Kept manual so copy reads naturally ("five").
export const PRODUCT_COUNT_WORD = "five"

// "Signal, Rank, Send, Voice, and Spy" — derived so it can never drift from the roster.
export const PRODUCT_LINES_LIST =
  PRODUCT_LINES.length > 1
    ? `${PRODUCT_LINES.slice(0, -1).join(", ")}, and ${PRODUCT_LINES[PRODUCT_LINES.length - 1]}`
    : PRODUCT_LINES[0]

// The trailing tagline used verbatim in every product-page JSON-LD description.
export const PRODUCT_LINES_TAGLINE = `One of ${PRODUCT_COUNT_WORD} Hubbly product lines — ${PRODUCT_LINES_LIST} — running from one shared buyer context, on autopilot by default with opt-in approval gates.`
