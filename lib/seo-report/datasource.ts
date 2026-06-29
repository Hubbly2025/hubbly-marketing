import type { Provenance } from "./types";

export type KeywordRow = {
  keyword: string;
  volume?: number;
  difficulty?: number;
  currentRank?: number;
  competitorRanks?: number[];
  url?: string;
  intent?: "commercial" | "informational" | "branded";
  provenance?: Provenance;
  source?: string;
  label?: string;
};

export type SerpRow = {
  keyword: string;
  url?: string;
  rank?: number;
  title?: string;
};

export type ScrapePageRow = {
  url: string;
  title: string | null;
  text: string;
};

export type CompetitorRow = {
  domain: string;
  commonKeywords?: number;
  organicKeywords?: number;
  organicEtv?: number;
};

export type BacklinkSummary = {
  referringDomains?: number;
  backlinks?: number;
  rank?: number;
  referringMainDomains?: number;
  brokenBacklinks?: number;
};

// §1 competitor-led gap: a commercial term a competitor ranks top-10 for that the
// target is absent on, IRA-intent-scored. competitorRank is the competitor's rank.
export type GapKeyword = {
  keyword: string;
  volume?: number;
  difficulty?: number;
  competitorDomain: string;
  competitorRank: number;
  pageType: "comparison" | "definition" | "guide";
  score: number;
};

export type NormalizedPullStatus = "pending" | "processing" | "complete" | "failed" | "empty";

export type NormalizedPull = {
  source: string;
  domain: string;
  fetchedAt: string;
  status: NormalizedPullStatus;
  provenance: Provenance;
  error?: string;
  data: {
    keywords?: KeywordRow[];
    serp?: SerpRow[];
    techStack?: string[];
    scrapePages?: ScrapePageRow[];
    competitors?: CompetitorRow[];
    backlinksSummary?: BacklinkSummary | null;
    gapKeywords?: GapKeyword[];
    domainRankOverview?: unknown;
    // True only when a DataForSEO call rejected our credentials (HTTP 401/403
    // or auth-class task code). Drives the loud auth_failed banner so we never
    // serve a silent "Unavailable" during a credential incident.
    authFailed?: boolean;
    authStatusCode?: number;
    authEndpoint?: string;
    [key: string]: unknown;
  };
};

export type SourceContext = {
  runId: string;
  signal?: AbortSignal;
  now?: () => Date;
};

/**
 * Signal data source contract.
 *
 * A source never throws for ordinary "no data" outcomes. It returns
 * `status: "empty"` with optional context in `error`. It rejects only for hard
 * transport, credential, schema, or timeout failures. The engine catches those
 * failures per source and converts them into failed NormalizedPull records so
 * one provider cannot abort an audit.
 *
 * Each source must self-bound to `timeoutMs`; the engine also wraps every source
 * with the same timeout as defense in depth.
 */
export interface SignalDataSource {
  readonly name: string;
  readonly timeoutMs: number;
  fetch(domain: string, ctx: SourceContext): Promise<NormalizedPull>;
}
