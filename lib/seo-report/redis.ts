import { Redis } from "@upstash/redis";
import { optionalEnv } from "./env";
import type { NormalizedPull } from "./datasource";

let redis: Redis | null | undefined;
const dataForSeoTtlSeconds = 60 * 60 * 24 * 30;
// Bump when the shape of a cached DataForSEO pull changes (new fields, new
// upstream calls). The 30-day TTL means an un-versioned key would otherwise
// serve a pre-feature snapshot for up to a month — e.g. a pull cached before
// competitors_domain / backlinks/summary were wired keeps returning empty
// sections and never re-calls DataForSEO, so no fresh pull or safe_failed log
// is ever emitted. v2 forces every domain's first post-deploy audit to
// actually execute the supplementary calls.
// v11 = Stage 2.1 hotfix. Fresh audits must not reuse pulls rendered under
// the over-broad digit-for-letter display normalizer.
// v10 = Stage 2.1 ship-ready audit. Fresh audits must not reuse pulls whose
// rendered keyword strings predate digit-for-letter display normalization.
// v9 = Stage 2 relevance cache bust. Fresh audits must not reuse pre-#23
// DataForSEO pulls that were shaped before relevance-gated synthesis.
// v8 = Stage 2 two-reviewer pass. The cached pull now carries authFailed /
// authStatusCode / authEndpoint, and its gapKeywords array is selected
// through isFragmentLikeKeyword — pre-v8 pulls were re-serving the
// pre-filter gap list to every audit (live AHG re-audit case).
const dataForSeoCacheVersion = "v11-scope-digit-normalization";

export function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = optionalEnv("UPSTASH_REDIS_REST_URL");
  const token = optionalEnv("UPSTASH_REDIS_REST_TOKEN");
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

export async function rateLimit(key: string): Promise<{ ok: boolean; remaining: number }> {
  const client = getRedis();
  if (!client) return { ok: true, remaining: 5 };

  // Intentionally un-versioned (unlike the audit/dfs payload caches): this holds
  // only an integer counter, carries no shape, and self-expires in 65s — there is
  // nothing stale a deploy could serve. See CLAUDE.md "Cache versioning".
  const windowKey = `signal:rate:${key}:${Math.floor(Date.now() / 60000)}`;
  const count = await client.incr(windowKey);
  if (count === 1) {
    await client.expire(windowKey, 65);
  }

  return {
    ok: count <= 5,
    remaining: Math.max(0, 5 - count)
  };
}

function dataForSeoCacheKey(domain: string): string {
  return `dfs:${dataForSeoCacheVersion}:${domain}`;
}

export async function getCachedDataForSeoPull(domain: string): Promise<NormalizedPull | null> {
  const client = getRedis();
  if (!client) return null;
  return client.get<NormalizedPull>(dataForSeoCacheKey(domain));
}

export async function setCachedDataForSeoPull(domain: string, pull: NormalizedPull): Promise<void> {
  const client = getRedis();
  if (!client) return;
  await client.set(dataForSeoCacheKey(domain), pull, { ex: dataForSeoTtlSeconds });
}
