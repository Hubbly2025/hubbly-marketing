export type BuyerType = "business" | "consumer";

export type BusinessModel =
  | "b2b_saas"
  | "b2b_services"
  | "b2c_ecommerce"
  | "b2c_financial_services"
  | "b2c_high_consideration"
  | "local_service"
  | "marketplace"
  | "investor_vc"
  | "media_content"
  | "other";

export type Evidence = {
  claim: string;
  source: "detected" | "inferred";
  provenance?: Provenance;
  basis: string;
};

export type Provenance = "measured" | "estimated" | "inferred" | "recommended";

export interface IntelligenceMetric<T = number> {
  value: T;
  provenance: Provenance;
  source: string;
  label: string;
  confidence?: number;
}

export type ProvenancedText = {
  value: string;
  provenance: "inferred" | "recommended";
  source: string;
  label: string;
  confidence?: number;
};

export type CategoryDemandIntelligence = {
  intentVolume: IntelligenceMetric<string>;
  sevenDay: IntelligenceMetric<string>;
  highIntent: IntelligenceMetric<string>;
  visitorRange: IntelligenceMetric<string>;
  geographies: IntelligenceMetric<string[]>;
  monthlySearchDemand: IntelligenceMetric<string>;
  visitorIdentificationOpportunity: IntelligenceMetric<string>;
  disclaimer: string;
};

export type SignalIntelligence = {
  id: string;
  domain: string;
  url: string;
  generatedAt: string;
  status: "ready" | "not_enough_signal";
  classifier: {
    buyer_type: BuyerType;
    business_model: BusinessModel;
    confidence: "low" | "medium" | "high";
    rationale: string;
  };
  detected: {
    companyName: string | null;
    valueProps: Evidence[];
    offers: Evidence[];
    proofPoints: Evidence[];
    callsToAction: Evidence[];
    techStack: Evidence[];
  };
  inferred: {
    positioning: Evidence[];
    conversionFriction: Evidence[];
    audienceSignals: Evidence[];
  };
  seo: {
    title: string | null;
    metaDescription: string | null;
    headings: string[];
    issues: Evidence[];
    opportunities: Evidence[];
  };
  personas: Array<{
    name: string;
    frame: "company" | "consumer" | "category";
    description: string;
    provenance: "inferred" | "recommended";
    detectedSignals: string[];
    inferredNeeds: string[];
  }>;
  competitiveLandscape: {
    disclaimer: string;
    suggestedAngles: Evidence[];
  };
  categoryDemand: CategoryDemandIntelligence;
  invisiblePipeline: {
    explanation: string;
    detectedReadinessSignals: Evidence[];
    recommendedPixelEvents: string[];
  };
  keywordThemes: Array<{
    theme: string;
    intent: "informational" | "commercial" | "transactional" | "navigational";
    phrases: string[];
    basis: string;
  }>;
  close: {
    headline: "Signal feeds Hubbly OS.";
    body: string;
  };
  seoReport?: SeoReport;
  scrape: {
    pagesRead: Array<{
      url: string;
      status: number;
      title: string | null;
      textSample: string;
    }>;
    notDetected: string[];
  };
};

export type SignalAudit = SignalIntelligence;

// --- Full SEO Audit + 90-Day Domination Plan report -------------------------
// Every value carries provenance. Measured fields come from DataForSEO or
// cleaned on-page text; forward projections and multi-engine (AEO/GEO) claims
// are always labeled "recommended" — never presented as measured.

export type ReportMetric = {
  value: string;
  provenance: Provenance;
  source: string;
  label: string;
  note?: string;
};

export type ReportPoint = {
  claim: string;
  provenance: Provenance;
  label: string;
  basis: string;
};

export type ReportKeyword = {
  keyword: string;
  volume?: number;
  currentRank?: number;
  competitorRanks?: number[];
  provenance: Provenance;
  label: string;
};

export type KeywordCluster = {
  name: string;
  intent: "commercial" | "informational" | "transactional" | "branded";
  provenance: Provenance;
  label: string;
  keywords: ReportKeyword[];
};

export type PlanMonth = {
  title: string;
  actions: string[];
  expectedResult: ReportMetric;
};

export type ReportCompetitors = {
  provenance: Provenance;
  label: string;
  items: Array<{ domain: string; basis: string }>;
};

export type ReportBacklinks = {
  provenance: Provenance;
  label: string;
  summary: string;
  metrics: ReportMetric[];
};

export type ExternalApiStatus = "measured" | "empty" | "auth_failed" | "unavailable";

export type SeoReport = {
  title: string;
  domain: string;
  generatedAt: string;
  // Pre-formatted scan date for printing; never recomputed downstream.
  scanDate: string;
  // True only when real DataForSEO data is present. Gates the "Measured via
  // DataForSEO" line so it never appears without measured data.
  dataforseoReturned: boolean;
  // Distinct from dataforseoReturned: tells the UI WHY measured data is
  // absent. "auth_failed" must render a service-unavailable state, never a
  // silent empty section. Older persisted audits without this field default
  // to "measured" if dataforseoReturned, otherwise "unavailable".
  externalApiStatus: ExternalApiStatus;
  measuredVia: string;
  scorecard: {
    organicKeywords: ReportMetric;
    monthlyTraffic: ReportMetric;
    referringDomains: ReportMetric;
    aiVisibility: ReportMetric;
    verdict: string;
  };
  strengths: ReportPoint[];
  weaknesses: ReportPoint[];
  keywordAnalysis: {
    clusters: KeywordCluster[];
    semanticNote: string;
  };
  // Null when the data source returned nothing — renders the exact fallback string.
  competitors: ReportCompetitors | null;
  backlinks: ReportBacklinks | null;
  // §1 competitor-led gap contract — the sales restructure and v0 design bind to these.
  // gapState "defend" is the empty-gap incumbent branch: the headline pivots to
  // defend-position, never a padded loss number. "greenfield" is the honest
  // thin-data branch after relevance filtering removes junk/noise.
  gapKeywords: Array<{
    keyword: string;
    volume?: number;
    competitorDomain: string;
    competitorRank: number;
    pageType: "comparison" | "definition" | "guide";
  }>;
  gapVolumeTotal: number;
  competitorGap: Array<{ domain: string; gapCount: number }>;
  gapState: "gaps" | "defend" | "greenfield";
  plan: {
    intro: string;
    months: PlanMonth[];
    totalOutput: string;
  };
  closer: {
    headline: string;
    body: string;
    semiAutopilot: string;
    fullAutopilot: string;
    cta: string;
  };
  // Final rendered report (LLM prose when available, deterministic markdown otherwise).
  markdown?: string;
};
