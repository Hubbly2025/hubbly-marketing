import Anthropic from "@anthropic-ai/sdk";
import type { Tool, ToolUseBlock } from "@anthropic-ai/sdk/resources/messages";
import { generationModel } from "./models";
import { optionalEnv } from "./env";
import type { Classification } from "./classifier";
import type { ScrapedPage } from "./scrape";
import type { Evidence, SignalAudit } from "./types";

type PartialAudit = Pick<
  SignalAudit,
  "detected" | "inferred" | "seo" | "personas" | "competitiveLandscape" | "invisiblePipeline" | "keywordThemes"
>;

const auditTool: Tool = {
  name: "return_signal_audit",
  description: "Return the grounded Hubbly Signal audit sections as strict JSON.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["detected", "inferred", "seo", "personas", "competitiveLandscape", "invisiblePipeline", "keywordThemes"],
    properties: {
      detected: { type: "object" },
      inferred: { type: "object" },
      seo: { type: "object" },
      personas: { type: "array", items: { type: "object" } },
      competitiveLandscape: { type: "object" },
      invisiblePipeline: { type: "object" },
      keywordThemes: { type: "array", items: { type: "object" } }
    }
  }
};

function emptyEvidence(claim: string, basis: string): Evidence {
  return { claim, source: "detected", basis };
}

// Hard guard: the regex that used to populate seo.headings here lifted nav
// fragments ("PRODUCTS Close PRODUCTS Open PRODUCTS", "Mythical Creatures
// Griffin 1") straight into the legacy report sections, which the report
// page rendered as "Detected headings" + "Keyword themes". The actual report
// surface is now seoReport (built deterministically in synthesis.ts); this
// fallback only fills the legacy shape. It MUST NOT echo scraped text.
//
// Defense in depth: even if a caller still wires these arrays into the UI,
// every entry here is a synthesized classifier-derived label. The report-page
// also sanitizes again before rendering.
export function fallbackAuditFromScrape(classification: Classification, pages: ScrapedPage[]): PartialAudit {
  const joined = pages.map((page) => page.text).join(" ").slice(0, 12000);
  const firstTitle = pages.find((page) => page.title)?.title || null;
  const frame: "consumer" | "company" | "category" =
    classification.business_model === "investor_vc" || classification.business_model === "media_content"
      ? "category"
      : classification.buyer_type === "consumer"
        ? "consumer"
        : "company";

  const synthesizedHeadings = synthesizedHeadingsForModel(classification.business_model);
  const synthesizedThemes = synthesizedThemesForModel(classification.business_model);

  return {
    detected: {
      companyName: firstTitle,
      valueProps: [emptyEvidence("Primary public-page messaging was detected from the scraped pages.", joined.slice(0, 240))],
      offers: [emptyEvidence("Specific offers were not detected from public pages.", "Not detected from public pages.")],
      proofPoints: [emptyEvidence("Proof points were not detected from public pages.", "Not detected from public pages.")],
      callsToAction: [emptyEvidence("Calls to action were not detected from public pages.", "Not detected from public pages.")],
      techStack: []
    },
    inferred: {
      positioning: [
        {
          claim: `The site appears to fit the ${classification.business_model} category.`,
          source: "inferred",
          basis: classification.rationale
        }
      ],
      conversionFriction: [
        {
          claim: "Signal could not verify deeper funnel paths from the limited public scrape.",
          source: "inferred",
          basis: "Only home, pricing and about pages were requested for this audit."
        }
      ],
      audienceSignals: []
    },
    seo: {
      title: firstTitle,
      metaDescription: null,
      headings: synthesizedHeadings,
      issues: [emptyEvidence("Meta description was not detected from public pages.", "Not detected from public pages.")],
      opportunities: [
        {
          claim: "Build category pages around the synthesized topical themes.",
          source: "inferred",
          basis: "Themes are derived from the classifier — never from raw scraped headings."
        }
      ]
    },
    personas: [
      {
        name: frame === "consumer" ? "High-intent consumer researcher" : frame === "company" ? "Qualified company evaluator" : "Category audience",
        frame,
        description:
          frame === "consumer"
            ? "A person comparing options and looking for proof before taking action."
            : frame === "company"
              ? "A company-side evaluator researching fit, credibility and next steps."
              : "An audience segment interested in the category rather than a forced sales-pipeline ICP.",
        provenance: "inferred",
        detectedSignals: [classification.rationale],
        inferredNeeds: ["Clear proof, obvious next step, and category-specific language."]
      }
    ],
    competitiveLandscape: {
      disclaimer: "Suggested angles only. Signal does not assert named competitor weaknesses from this scrape.",
      suggestedAngles: [
        {
          claim: "Differentiate around the clearest detected promise from the audited pages.",
          source: "inferred",
          basis: "No competitor weaknesses are asserted without direct evidence."
        }
      ]
    },
    invisiblePipeline: {
      explanation: "A visitor-identification pixel can turn anonymous category demand into account and contact-level follow-up signals.",
      detectedReadinessSignals: [
        {
          claim: "Public pages create enough demand context to define visitor segments.",
          source: "inferred",
          basis: classification.rationale
        }
      ],
      recommendedPixelEvents: ["Page viewed", "CTA clicked", "Pricing viewed", "Return visit"]
    },
    keywordThemes: synthesizedThemes
  };
}

// Synthesized topical labels per business model. These are consultant-grade
// section labels, sentence case, never copied from scraped page text. The full
// SEO report (seoReport) is the real surface; these only backfill the legacy
// audit shape for older audits / partial renders.
function synthesizedHeadingsForModel(model: Classification["business_model"]): string[] {
  switch (model) {
    case "b2c_financial_services":
      return ["Retirement diversification narrative", "Trust and account-specialist proof", "Education-led conversion path"];
    case "b2c_high_consideration":
      return ["Comparison-stage education", "Trust and warranty proof", "Consultative purchase path"];
    case "b2c_ecommerce":
      return ["Category landing depth", "Shipping and returns clarity", "Comparison and review proof"];
    case "local_service":
      return ["Local intent landing pages", "Licensing and service proof", "Same-day booking path"];
    case "b2b_saas":
      return ["Buyer-stage messaging depth", "Integration and onboarding proof", "ROI and pricing transparency"];
    case "b2b_services":
      return ["Engagement scoping clarity", "Outcome and case-study proof", "Consultative discovery path"];
    case "marketplace":
      return ["Two-sided onboarding clarity", "Quality and trust signals", "Discovery and search depth"];
    case "investor_vc":
      return ["Portfolio thesis clarity", "Operator-network proof", "Founder-facing path"];
    case "media_content":
      return ["Category authority depth", "Subscription and retention proof", "Editorial cadence signals"];
    default:
      return ["Category positioning depth", "Proof and credibility signals", "Clear next-step path"];
  }
}

function synthesizedThemesForModel(model: Classification["business_model"]): PartialAudit["keywordThemes"] {
  const headings = synthesizedHeadingsForModel(model);
  return headings.map((heading) => ({
    theme: heading,
    intent: "commercial",
    phrases: [heading.toLowerCase()],
    basis: "Inferred from classifier; not echoed from scraped page text."
  }));
}

export async function parseWithClaude(
  domain: string,
  classification: Classification,
  pages: ScrapedPage[]
): Promise<PartialAudit> {
  const apiKey = optionalEnv("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return fallbackAuditFromScrape(classification, pages);
  }

  const anthropic = new Anthropic({ apiKey });
  const groundedText = pages.map((page) => `URL: ${page.url}\nTITLE: ${page.title || "Not detected"}\nTEXT:\n${page.text}`).join("\n\n---\n\n");

  const message = await anthropic.messages.create({
    model: generationModel,
    max_tokens: 5000,
    temperature: 0,
    tools: [auditTool],
    tool_choice: { type: "tool", name: "return_signal_audit" },
    messages: [
      {
        role: "user",
        content: `Create a Hubbly Signal audit for ${domain}.

Classifier already ran first:
${JSON.stringify(classification)}

Rules:
- Use the return_signal_audit tool exactly once.
- Ground detected claims only in scraped text.
- Label inferred claims with source "inferred".
- If not on public pages, say "Not detected from public pages."
- For investor_vc, nonprofit, media/content, do not force ICP or sales-pipeline framing.
- For consumer businesses, use people/life-stage personas and no CAC, RevOps, or B2B SaaS framing.
- Gate SaaS terms to software businesses only.
- Competitive landscape must contain suggested angles only.

Scraped text:
${groundedText}`
      }
    ]
  });

  const toolUse = message.content.find(isSignalAuditToolUse);

  return isPartialAudit(toolUse?.input) ? toolUse.input : fallbackAuditFromScrape(classification, pages);
}

function isSignalAuditToolUse(block: unknown): block is ToolUseBlock {
  return (
    Boolean(block) &&
    typeof block === "object" &&
    (block as { type?: unknown }).type === "tool_use" &&
    (block as { name?: unknown }).name === "return_signal_audit"
  );
}

function isPartialAudit(value: unknown): value is PartialAudit {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Record<keyof PartialAudit, unknown>>;
  return (
    typeof candidate.detected === "object" &&
    typeof candidate.inferred === "object" &&
    typeof candidate.seo === "object" &&
    Array.isArray(candidate.personas) &&
    typeof candidate.competitiveLandscape === "object" &&
    typeof candidate.invisiblePipeline === "object" &&
    Array.isArray(candidate.keywordThemes)
  );
}
