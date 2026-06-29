import type { BusinessModel, CategoryDemandIntelligence, IntelligenceMetric } from "./types";

function hashDomain(domain: string): number {
  let hash = 2166136261;
  for (const char of domain) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function bucket(hash: number, min: number, max: number): number {
  return Math.round(min + (hash / 0xffffffff) * (max - min));
}

const ranges: Record<BusinessModel, { search: [number, number]; visitors: [number, number] }> = {
  b2b_saas: { search: [900, 8200], visitors: [120, 1200] },
  b2b_services: { search: [500, 5200], visitors: [80, 750] },
  b2c_ecommerce: { search: [1800, 22000], visitors: [300, 2800] },
  b2c_financial_services: { search: [1200, 18000], visitors: [180, 1800] },
  b2c_high_consideration: { search: [900, 14000], visitors: [140, 1500] },
  local_service: { search: [250, 4200], visitors: [35, 420] },
  marketplace: { search: [700, 9000], visitors: [120, 1300] },
  investor_vc: { search: [350, 4200], visitors: [45, 480] },
  media_content: { search: [1200, 16000], visitors: [160, 1800] },
  other: { search: [150, 1800], visitors: [20, 220] }
};

function formatRange(center: number): string {
  const low = Math.max(10, Math.round(center * 0.72));
  const high = Math.round(center * 1.28);
  return `${low.toLocaleString()}-${high.toLocaleString()}`;
}

function categoryEstimate<T>(value: T, sourceDetail: string): IntelligenceMetric<T> {
  return {
    value,
    provenance: "estimated",
    source: "category-benchmark",
    label: "Estimate",
    confidence: 0.62
  };
}

export function buildCategoryDemandEstimate(
  domain: string,
  businessModel: BusinessModel
): CategoryDemandIntelligence {
  const hash = hashDomain(`${domain}:${businessModel}`);
  const selected = ranges[businessModel];
  const monthlySearches = bucket(hash, selected.search[0], selected.search[1]);
  const identifiableVisitors = bucket(hash >>> 3, selected.visitors[0], selected.visitors[1]);
  const sevenDay = Math.max(10, Math.round(monthlySearches / 4.35));
  const highIntent = Math.max(5, Math.round(sevenDay * 0.28));
  const geographies = businessModel === "local_service" ? ["Local metro", "Nearby suburbs"] : ["United States", "High-income metros"];

  return {
    intentVolume: categoryEstimate(formatRange(monthlySearches), "Derived from a stable domain hash and category range, not live keyword volume."),
    sevenDay: categoryEstimate(formatRange(sevenDay), "Seven-day demand is estimated from the category monthly range."),
    highIntent: categoryEstimate(formatRange(highIntent), "High-intent demand is estimated from category intent mix."),
    visitorRange: categoryEstimate(formatRange(identifiableVisitors), "Estimated identifiable visitor range after pixel deployment."),
    geographies: categoryEstimate(geographies, "Estimated category geographies from business model."),
    monthlySearchDemand: categoryEstimate(formatRange(monthlySearches), "Derived from a stable domain hash and category range, not live keyword volume."),
    visitorIdentificationOpportunity: categoryEstimate(
      formatRange(identifiableVisitors),
      "Estimated category traffic that could become account or contact-level signal after pixel deployment."
    ),
    disclaimer: "These are category estimates, not measured analytics, ad platform data, or Hubbly OS pipeline."
  };
}
