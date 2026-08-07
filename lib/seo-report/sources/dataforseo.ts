import type { BacklinkSummary, CompetitorRow, GapKeyword, KeywordRow, NormalizedPull, SourceContext, SignalDataSource } from "../datasource";
import { envCandidateNames, getDataForSeoEnv } from "../env";
import { brandLabelFromDomain } from "../keyword-filter";
import { selectGapKeywords, type CompetitorKeywordSet } from "../gap-source";
import { getCachedDataForSeoPull, setCachedDataForSeoPull } from "../redis";

const endpointBase = "https://api.dataforseo.com/v3";
const measuredSource = "DataForSEO";
const measuredLabel = "Measured · Hubbly";

// Raised on HTTP 401/403 or auth-class task codes (20100/40100/40101/40102) so
// the audit pipeline can flag the result loudly instead of degrading silently
// into "Unavailable". The keys are funded in prod; an auth_failed line is a
// real-money config issue, never an empty-data scenario.
export class DataForSeoAuthError extends Error {
  constructor(
    message: string,
    readonly endpoint: string,
    readonly statusCode: number
  ) {
    super(message);
    this.name = "DataForSeoAuthError";
  }
}

type DataForSeoFixture = {
  domain: string;
  ranked_keywords: Array<{
    keyword: string;
    volume?: number;
    difficulty?: number;
    current_rank?: number;
    rank?: number;
    url?: string;
    competitor_ranks?: number[];
    intent?: string;
  }>;
};

type DataForSeoResponse = {
  tasks?: Array<{
    id?: string;
    status_code?: number;
    status_message?: string;
    result?: unknown[];
  }>;
};

export class DataForSeoSource implements SignalDataSource {
  readonly name = measuredSource;
  // 24s covers the supplementary calls plus the sequential gap leg: the competitor
  // list (postLiveSafe, 13s) must resolve before the top competitors' ranked
  // keywords are fetched in parallel for the gap source. Still under the 28s scrape
  // step it runs in parallel with, so the route's 55s cap is never threatened.
  readonly timeoutMs = 24000;

  async fetch(domain: string, ctx: SourceContext): Promise<NormalizedPull> {
    const cached = await getCachedDataForSeoPull(domain);
    if (cached) return cached;

    const auth = getDataForSeoAuth();
    if (!auth) {
      const env = getDataForSeoEnv();
      const message = "DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are required to activate measured keyword data.";
      if (process.env.NODE_ENV === "production") {
        // Report which half is missing and which names were checked. Logging
        // only `message` made a missing login indistinguishable from a missing
        // password, so this failure was effectively undebuggable in prod.
        console.warn("signal.dataforseo.config_missing", {
          domain,
          message,
          loginResolved: Boolean(env.login),
          passwordResolved: Boolean(env.password),
          checkedNames: [
            ...envCandidateNames("DATAFORSEO_LOGIN"),
            ...envCandidateNames("DATAFORSEO_PASSWORD")
          ]
        });
        return failedPull(domain, ctx, message);
      }
      throw new Error(message);
    }

    console.info("signal.dataforseo.auth_ok", {
      domain,
      endpoint: endpointBase,
      login: maskLogin(getDataForSeoEnv().login)
    });

    const startedAt = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    const signal = ctx.signal || controller.signal;
    let rankedKeywords: unknown;
    let overview: unknown;
    // Wrap the core ranked-keyword + overview calls so a 401/403 from the live
    // endpoint becomes an auth_failed pull with an explicit flag — never a
    // silent "DataForSEO failed" line that the UI renders as "Unavailable".
    const tryAuth = async (): Promise<[unknown, unknown] | NormalizedPull> => {
      try {
        const [keywords, rank] = await Promise.all([
          this.postLive("/dataforseo_labs/google/ranked_keywords/live", [{ target: domain, location_name: "United States", language_name: "English", limit: 10 }], auth, signal),
          this.postLive("/dataforseo_labs/google/domain_rank_overview/live", [{ target: domain, location_name: "United States", language_name: "English" }], auth, signal)
        ]);
        return [keywords, rank];
      } catch (error) {
        if (error instanceof DataForSeoAuthError) {
          console.error("signal.dataforseo.auth_failed", {
            domain,
            endpoint: error.endpoint,
            statusCode: error.statusCode,
            message: error.message,
            durationMs: Date.now() - startedAt
          });
          return authFailedPull(domain, ctx, error);
        }
        throw error;
      }
    };
    // Supplementary calls. postLiveSafe re-raises DataForSeoAuthError
    // specifically (other failures still resolve to null), so a competitor /
    // backlink call that lost auth must surface as the auth_failed pull, not
    // an empty section. We attach the auth-capturing .catch() at PROMISE
    // CREATION so a rejection has a handler immediately — even if the core
    // path returns early via tryAuth and the supplementary await never runs.
    // Without the eager handler the late rejection becomes an unhandled
    // process-level rejection (the test runner catches it; in prod it spams
    // the logger).
    let supplementaryAuthError: DataForSeoAuthError | null = null;
    const captureAuth = <T,>(promise: Promise<T>): Promise<T | null> =>
      promise.catch((error) => {
        if (error instanceof DataForSeoAuthError) {
          supplementaryAuthError = supplementaryAuthError || error;
          return null;
        }
        throw error;
      });
    const competitorsPromise = captureAuth(
      this.postLiveSafe(
        "/dataforseo_labs/google/competitors_domain/live",
        [{ target: domain, location_name: "United States", language_name: "English", limit: 20 }],
        auth
      )
    );
    const backlinksPromise = captureAuth(
      this.postLiveSafe(
        "/backlinks/summary/live",
        [{ target: domain, internal_list_limit: 10, backlinks_status_type: "live" }],
        auth
      )
    );
    let coreResult: [unknown, unknown] | NormalizedPull;
    try {
      coreResult = await tryAuth();
    } finally {
      clearTimeout(timer);
    }
    if (!Array.isArray(coreResult)) {
      const pull = coreResult;
      // Cache the auth_failed result briefly via the same dfs:${domain} key so
      // a burst of audits during a credential incident doesn't multiply the
      // 401 calls. The cache TTL (30 days) is fine here — the operator clears
      // it explicitly after rotating credentials.
      await setCachedDataForSeoPull(domain, pull);
      // Drain supplementary promises so any late auth rejection is captured
      // into supplementaryAuthError instead of becoming an unhandled
      // rejection on the event loop. We do not block on them after the core
      // result is decided — captureAuth has already attached the handler.
      void Promise.allSettled([competitorsPromise, backlinksPromise]);
      return pull;
    }
    [rankedKeywords, overview] = coreResult;

    const keywords = parseRankedKeywordRows(rankedKeywords).slice(0, 10);
    const competitorsRaw = await competitorsPromise;
    const competitors = parseCompetitors(competitorsRaw)
      .filter((row) => isRealCompetitor(row.domain, domain))
      .slice(0, 5);
    const backlinksRaw = await backlinksPromise;
    const backlinksSummary = parseBacklinkSummary(backlinksRaw);
    // §1 gap source: needs the filtered competitor list + the target's own keywords,
    // so it runs after both. Self-bounded and non-fatal — yields [] on any failure.
    // Auth errors inside the gap source bubble up through fetchGapKeywords' own
    // safeAwait usage; pre-check the supplementary error before invoking it so
    // we skip the extra competitor fan-out once auth is known to be broken.
    let gapKeywords: GapKeyword[] = [];
    if (!supplementaryAuthError) {
      try {
        gapKeywords = await this.fetchGapKeywords(domain, competitors, keywords, auth);
      } catch (error) {
        if (error instanceof DataForSeoAuthError) {
          supplementaryAuthError = error;
        } else {
          throw error;
        }
      }
    }

    if (supplementaryAuthError) {
      const authError: DataForSeoAuthError = supplementaryAuthError;
      console.error("signal.dataforseo.auth_failed", {
        domain,
        endpoint: authError.endpoint,
        statusCode: authError.statusCode,
        message: authError.message,
        durationMs: Date.now() - startedAt,
        phase: "supplementary"
      });
      const pull = authFailedPull(domain, ctx, authError);
      await setCachedDataForSeoPull(domain, pull);
      return pull;
    }
    const pull: NormalizedPull = {
      source: measuredSource,
      domain,
      fetchedAt: ctx.now?.().toISOString() || new Date().toISOString(),
      status: keywords.length > 0 ? "complete" : "empty",
      provenance: "measured",
      error: keywords.length > 0 ? undefined : "DataForSEO returned no ranked keywords.",
      data: {
        keywords,
        domainRankOverview: overview,
        competitors,
        backlinksSummary,
        gapKeywords
      }
    };

    await setCachedDataForSeoPull(domain, pull);
    console.info("signal.dataforseo.pull", {
      domain,
      status: pull.status,
      keywordCount: keywords.length,
      competitorCount: competitors.length,
      hasBacklinks: Boolean(backlinksSummary),
      gapCount: gapKeywords.length,
      durationMs: Date.now() - startedAt
    });
    return pull;
  }

  // Best-effort POST for supplementary datasets. Self-bounded; swallows
  // transport, status, and task errors as null so a slow competitors/backlinks
  // call never blocks the core ranked-keyword pull.
  //
  // SECURITY/OBSERVABILITY EXCEPTION: 401/403 + auth-class task codes
  // (20100/40100/40101/40102) are NOT swallowed — they re-raise as
  // DataForSeoAuthError so the pipeline can convert "supplementary call lost
  // auth" into the auth_failed audit state. Hiding an auth incident behind
  // safe_failed/null was the silent-degradation bug the two-reviewer pass
  // flagged: the customer saw "no competitors" instead of "our infra has an
  // issue."
  //
  // The auth detection re-uses the same status set as postLive (the strict
  // path), so any DataForSEO endpoint that rejects our credentials triggers
  // the same loud-fail behaviour regardless of which caller invoked it.
  private async postLiveSafe(path: string, body: unknown, auth: string, timeoutMs = 13000): Promise<unknown> {
    try {
      const response = await fetch(`${endpointBase}${path}`, {
        method: "POST",
        headers: { authorization: `Basic ${auth}`, "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs)
      });
      if (response.status === 401 || response.status === 403) {
        throw new DataForSeoAuthError(`DataForSEO ${path} rejected credentials: ${response.status} ${response.statusText}`, path, response.status);
      }
      if (!response.ok) {
        console.warn("signal.dataforseo.safe_failed", { path, reason: `http_${response.status}` });
        return null;
      }
      const json = (await response.json().catch(() => null)) as DataForSeoResponse | null;
      const task = json?.tasks?.[0];
      if (task?.status_code && isAuthTaskStatus(task.status_code)) {
        throw new DataForSeoAuthError(
          `DataForSEO ${path} task auth failed: ${task.status_code} ${task.status_message || "Unknown error"}`,
          path,
          task.status_code
        );
      }
      if (task?.status_code && task.status_code >= 40000) {
        console.warn("signal.dataforseo.safe_failed", { path, reason: `task_${task.status_code}`, message: task.status_message });
        return null;
      }
      return json;
    } catch (error) {
      if (error instanceof DataForSeoAuthError) throw error;
      const name = error instanceof Error ? error.name : "";
      const reason = name === "TimeoutError" || name === "AbortError" ? "timeout" : error instanceof Error ? error.message : "error";
      console.warn("signal.dataforseo.safe_failed", { path, reason });
      return null;
    }
  }

  // §1 gap source. Fetch the top real competitors' ranked keywords (parallel,
  // self-bounded) and select the IRA-intent-scored terms the target is absent on.
  // Non-fatal: any failure or absence of competitors yields [].
  private async fetchGapKeywords(
    domain: string,
    competitors: CompetitorRow[],
    targetKeywords: KeywordRow[],
    auth: string
  ): Promise<GapKeyword[]> {
    const topCompetitors = competitors.slice(0, 5);
    if (topCompetitors.length === 0) return [];
    // limit 100: a bullion competitor's IRA terms rank below its high-traffic
    // spot-price terms in its own ranked set, so a shallow pull never reaches them.
    // We fetch deep, hard-exclude commodity noise, then IRA-weight the survivors.
    const sets = await Promise.all(
      topCompetitors.map(async (competitor): Promise<CompetitorKeywordSet> => {
        const payload = await this.postLiveSafe(
          "/dataforseo_labs/google/ranked_keywords/live",
          [{ target: competitor.domain, location_name: "United States", language_name: "English", limit: 100 }],
          auth,
          9000
        );
        return { domain: competitor.domain, rows: parseRankedKeywordRows(payload) };
      })
    );
    return selectGapKeywords(sets, targetKeywords, brandLabelFromDomain(domain));
  }

  private async postLive(path: string, body: unknown, auth: string, signal?: AbortSignal): Promise<unknown> {
    const response = await fetch(`${endpointBase}${path}`, {
      method: "POST",
      headers: {
        authorization: `Basic ${auth}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(body),
      signal
    });
    const json = (await response.json().catch(() => null)) as DataForSeoResponse | null;
    if (response.status === 401 || response.status === 403) {
      throw new DataForSeoAuthError(`DataForSEO ${path} rejected credentials: ${response.status} ${response.statusText}`, path, response.status);
    }
    if (!response.ok) {
      throw new Error(`DataForSEO ${path} failed: ${response.status} ${response.statusText}`);
    }
    const task = json?.tasks?.[0];
    if (task?.status_code && isAuthTaskStatus(task.status_code)) {
      throw new DataForSeoAuthError(
        `DataForSEO ${path} task auth failed: ${task.status_code} ${task.status_message || "Unknown error"}`,
        path,
        task.status_code
      );
    }
    if (task?.status_code && task.status_code >= 40000) {
      throw new Error(`DataForSEO ${path} task failed: ${task.status_code} ${task.status_message || "Unknown error"}`);
    }
    return json;
  }

  async submitTask(path: string, body: unknown, auth = getDataForSeoAuth()): Promise<string> {
    if (!auth) throw new Error("DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are required to submit DataForSEO tasks.");
    const response = await fetch(`${endpointBase}${path}/task_post`, {
      method: "POST",
      headers: {
        authorization: `Basic ${auth}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const json = (await response.json()) as DataForSeoResponse;
    const task = json.tasks?.[0];
    if (!response.ok || !task?.id) {
      throw new Error(`DataForSEO task submit failed: ${response.status} ${response.statusText}`);
    }
    return task.id;
  }

  async pollTask(path: string, taskId: string, auth = getDataForSeoAuth(), timeoutMs = 10000): Promise<unknown> {
    if (!auth) throw new Error("DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD are required to poll DataForSEO tasks.");
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const response = await fetch(`${endpointBase}${path}/task_get/${taskId}`, {
        headers: { authorization: `Basic ${auth}` }
      });
      const json = (await response.json()) as DataForSeoResponse;
      const task = json.tasks?.[0];
      if (response.ok && task?.result) return json;
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    throw new Error(`DataForSEO task ${taskId} timed out after ${timeoutMs}ms.`);
  }
}

export function dataForSeoFixtureToPull(fixture: DataForSeoFixture, fetchedAt = new Date().toISOString()): NormalizedPull {
  return {
    source: measuredSource,
    domain: fixture.domain,
    fetchedAt,
    status: fixture.ranked_keywords.length > 0 ? "complete" : "empty",
    provenance: "measured",
    data: {
      keywords: fixture.ranked_keywords.map((row) => measuredKeywordRow({
        keyword: row.keyword,
        volume: row.volume,
        difficulty: row.difficulty,
        currentRank: row.current_rank ?? row.rank,
        competitorRanks: row.competitor_ranks,
        url: row.url,
        intent: intentValue(row.intent)
      }))
    }
  };
}

function parseCompetitors(payload: unknown): CompetitorRow[] {
  const tasks = (payload as DataForSeoResponse | null)?.tasks || [];
  const rows: CompetitorRow[] = [];
  for (const task of tasks) {
    for (const result of task.result || []) {
      const items = (result as { items?: unknown[] }).items || [];
      for (const item of items) {
        const record = asRecord(item);
        const competitorDomain = stringValue(record?.domain);
        if (!competitorDomain) continue;
        const organic = asRecord(asRecord(record?.full_domain_metrics ?? record?.metrics)?.organic);
        rows.push({
          domain: competitorDomain,
          commonKeywords: numberValue(record?.intersections),
          organicKeywords: numberValue(organic?.count),
          organicEtv: numberValue(organic?.etv)
        });
      }
    }
  }
  // No slice here: self + mega-platform filtering happens at the call site before
  // the top-5 cap, so the cap counts real competitors, not noise rows.
  return rows;
}

// competitors_domain always surfaces these because they share keywords with
// almost every domain — they are never a content gap a customer can "close", so
// they are dropped from the measured competitor set (along with the target
// itself). Root-domain match only; subdomains of a platform collapse to root.
const MEGA_PLATFORM_DOMAINS = new Set([
  "youtube.com", "reddit.com", "facebook.com", "instagram.com", "twitter.com", "x.com",
  "linkedin.com", "tiktok.com", "pinterest.com", "quora.com", "medium.com",
  "wikipedia.org", "fandom.com", "wordpress.com", "blogspot.com",
  "amazon.com", "ebay.com", "etsy.com", "walmart.com", "craigslist.org",
  "google.com", "bing.com", "yahoo.com", "apple.com", "microsoft.com",
  "yelp.com", "indeed.com", "glassdoor.com", "nytimes.com", "forbes.com"
]);

function rootDomain(value: string): string {
  return value
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .trim();
}

// True for a domain that is a genuine category competitor: not the target itself,
// not a generic mega-platform. Exported for the §4 / §1 filter and its tests.
export function isRealCompetitor(competitorDomain: string, targetDomain: string): boolean {
  const candidate = rootDomain(competitorDomain);
  if (!candidate || !candidate.includes(".")) return false;
  if (candidate === rootDomain(targetDomain)) return false;
  if (MEGA_PLATFORM_DOMAINS.has(candidate)) return false;
  return true;
}

function parseBacklinkSummary(payload: unknown): BacklinkSummary | null {
  const tasks = (payload as DataForSeoResponse | null)?.tasks || [];
  for (const task of tasks) {
    for (const result of task.result || []) {
      const record = asRecord(result);
      if (!record) continue;
      const summary: BacklinkSummary = {
        referringDomains: numberValue(record.referring_domains),
        backlinks: numberValue(record.backlinks),
        rank: numberValue(record.rank),
        referringMainDomains: numberValue(record.referring_main_domains),
        brokenBacklinks: numberValue(record.broken_backlinks)
      };
      if (Object.values(summary).every((value) => value === undefined)) return null;
      return summary;
    }
  }
  return null;
}

function getDataForSeoAuth(): string | null {
  const { login, password } = getDataForSeoEnv();
  return login && password ? Buffer.from(`${login}:${password}`).toString("base64") : null;
}

// Masks the login for logs so we can confirm auth loudly without leaking it.
function maskLogin(login?: string): string {
  if (!login) return "unknown";
  if (login.length <= 4) return "****";
  return `${login.slice(0, 2)}***${login.slice(-2)}`;
}

function failedPull(domain: string, ctx: SourceContext, error: string): NormalizedPull {
  return {
    source: measuredSource,
    domain,
    fetchedAt: ctx.now?.().toISOString() || new Date().toISOString(),
    status: "failed",
    provenance: "measured",
    error,
    data: { authFailed: false }
  };
}

// authFailed is the explicit, code-side flag the pipeline reads to decide
// whether the lack of measured data is a credential incident (loud) or an
// honest empty-data outcome (quiet). The pipeline's summary log + the report
// page's banner key off this flag.
function authFailedPull(domain: string, ctx: SourceContext, error: DataForSeoAuthError): NormalizedPull {
  return {
    source: measuredSource,
    domain,
    fetchedAt: ctx.now?.().toISOString() || new Date().toISOString(),
    status: "failed",
    provenance: "measured",
    error: error.message,
    data: {
      authFailed: true,
      authStatusCode: error.statusCode,
      authEndpoint: error.endpoint
    }
  };
}

// 20100 = "Authorization required". 40100/40101/40102 = auth-class task errors
// surfaced inside a 200-OK response.
function isAuthTaskStatus(statusCode: number): boolean {
  return statusCode === 20100 || statusCode === 40100 || statusCode === 40101 || statusCode === 40102;
}

function parseRankedKeywordRows(payload: unknown): KeywordRow[] {
  const tasks = (payload as DataForSeoResponse | null)?.tasks || [];
  return tasks.flatMap((task) =>
    (task.result || []).flatMap((result) => {
      const items = (result as { items?: unknown[] }).items || [];
      return items.map(parseRankedKeywordItem).filter((row): row is KeywordRow => Boolean(row));
    })
  );
}

function parseRankedKeywordItem(item: unknown): KeywordRow | null {
  const record = item as Record<string, unknown>;
  const keywordData = asRecord(record.keyword_data);
  const keywordInfo = asRecord(keywordData?.keyword_info);
  const keywordProperties = asRecord(keywordData?.keyword_properties);
  const serpElement = asRecord(record.ranked_serp_element);
  const serpItem = asRecord(serpElement?.serp_item);
  const keyword = stringValue(record.keyword) || stringValue(keywordData?.keyword);
  if (!keyword) return null;

  return measuredKeywordRow({
    keyword,
    volume: numberValue(record.search_volume) ?? numberValue(keywordInfo?.search_volume),
    difficulty: numberValue(record.keyword_difficulty) ?? numberValue(keywordProperties?.keyword_difficulty),
    currentRank: numberValue(record.rank) ?? numberValue(record.current_rank) ?? numberValue(serpItem?.rank_absolute),
    url: stringValue(record.url) || stringValue(serpItem?.url),
    intent: intentValue(record.intent)
  });
}

function measuredKeywordRow(row: Omit<KeywordRow, "provenance" | "source" | "label">): KeywordRow {
  return {
    ...row,
    provenance: "measured",
    source: measuredSource,
    label: measuredLabel
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function intentValue(value: unknown): KeywordRow["intent"] | undefined {
  return value === "commercial" || value === "informational" || value === "branded" ? value : undefined;
}
