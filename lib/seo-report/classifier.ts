import type { BusinessModel, BuyerType } from "./types";

export type Classification = {
  buyer_type: BuyerType;
  business_model: BusinessModel;
  confidence: "low" | "medium" | "high";
  rationale: string;
};

const modelSignals: Array<{ model: BusinessModel; patterns: RegExp[]; buyer: BuyerType }> = [
  {
    model: "investor_vc",
    buyer: "business",
    patterns: [/venture capital/i, /\bvc firm\b/i, /\binvests?\b/i, /\bportfolio companies\b/i, /\bfounders\b/i]
  },
  {
    model: "b2c_financial_services",
    buyer: "consumer",
    patterns: [/retirement/i, /precious metals/i, /\bira\b/i, /wealth/i, /investment/i, /insurance/i, /loan/i]
  },
  {
    model: "b2b_saas",
    buyer: "business",
    patterns: [/\bsoftware\b/i, /\bplatform\b/i, /\bapi\b/i, /\bdashboard\b/i, /\bworkflow\b/i, /\bcrm\b/i, /\bsaas\b/i]
  },
  {
    model: "b2b_services",
    buyer: "business",
    patterns: [/agency/i, /consulting/i, /managed service/i, /for businesses/i, /enterprise/i]
  },
  {
    model: "b2c_ecommerce",
    buyer: "consumer",
    patterns: [/shop\b/i, /cart/i, /shipping/i, /returns/i, /buy now/i]
  },
  {
    model: "local_service",
    buyer: "consumer",
    patterns: [/near me/i, /schedule service/i, /licensed/i, /repair/i, /installation/i, /local/i]
  },
  {
    model: "marketplace",
    buyer: "consumer",
    patterns: [/marketplace/i, /buyers and sellers/i, /book providers/i, /vendors/i]
  },
  {
    model: "media_content",
    buyer: "consumer",
    patterns: [/newsletter/i, /podcast/i, /publication/i, /articles/i, /subscribe/i]
  }
];

export function classifyFromText(domain: string, text: string): Classification {
  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized.length < 160) {
    return {
      buyer_type: "business",
      business_model: "other",
      confidence: "low",
      rationale: "Not enough public-page text was detected to classify beyond other."
    };
  }

  const scored = modelSignals
    .map((entry) => ({
      ...entry,
      score: entry.patterns.reduce((sum, pattern) => sum + (pattern.test(normalized) ? 1 : 0), 0)
    }))
    .sort((a, b) => b.score - a.score);

  const winner = scored[0];

  if (!winner || winner.score === 0) {
    return {
      buyer_type: "business",
      business_model: "other",
      confidence: "low",
      rationale: `Public pages for ${domain} did not expose enough category language for a confident model.`
    };
  }

  if (winner.model === "b2b_saas" && /venture capital|precious metals|\bira\b|retirement/i.test(normalized)) {
    const override = scored.find((entry) => entry.model === "investor_vc" || entry.model === "b2c_financial_services");
    if (override && override.score > 0) {
      return {
        buyer_type: override.buyer,
        business_model: override.model,
        confidence: override.score >= 3 ? "high" : "medium",
        rationale: `Category-specific language outweighed generic software terms on ${domain}.`
      };
    }
  }

  return {
    buyer_type: winner.buyer,
    business_model: winner.model,
    confidence: winner.score >= 3 ? "high" : "medium",
    rationale: `Matched ${winner.score} public-page category signals for ${winner.model}.`
  };
}
