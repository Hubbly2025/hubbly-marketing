// Signal → Rank JobSpec contract (rank-agent-spec v1.1 §4.1, reconciled).
//
// This is the EMITTER side. Signal builds this payload; the Rank agent in
// hubbly-api-server consumes it (handle_ingest_gaps → page_targets +
// keyword_semantic_clusters). Both sides must agree on this shape before a
// handler is built — change them in a paired migration, never one alone.
//
// Reconciliation vs the originally-shipped builder:
// - measured fields kept (volume/difficulty/current_rank/strike_zone) because
//   keyword_semantic_clusters stores them — but flattened from IntelligenceMetric
//   to plain numbers to match the integer columns on the consumer side.
// - `topic` + `page_type` added to feed page_targets; `keyword` retained for the
//   clusters table + traceability.
// - intent ∈ commercial|informational|branded and priority ∈ high|normal|low
//   match the consumer check constraints (Manus `navigational`/`transactional`
//   dropped; `medium` → `normal`).

export type SeoGapPageType = "comparison" | "definition" | "guide";

export type SeoGap = {
  topic: string; // page topic seed (Rank's plan_page refines)
  keyword: string; // measured head keyword
  page_type: SeoGapPageType;
  intent: "commercial" | "informational" | "branded";
  priority: "high" | "normal" | "low";
  volume?: number;
  difficulty?: number;
  current_rank?: number;
  strike_zone: boolean;
};

export interface RankIngestGapsJob {
  job_type: "rank:ingest_gaps";
  dedupe_key: string;
  payload: {
    domain: string;
    gaps: SeoGap[];
  };
}

// Pure builder. The actual enqueue into the OS `job_queue` is a separate
// integration (Signal runs on its own Supabase; emit path — OS service-role
// creds vs an api-server ingest endpoint — is an open decision and is NOT wired
// here).
export function buildRankIngestGapsJob(domain: string, gaps: SeoGap[]): RankIngestGapsJob {
  return {
    job_type: "rank:ingest_gaps",
    dedupe_key: `rank:ingest_gaps:${domain}`,
    payload: {
      domain,
      gaps
    }
  };
}
