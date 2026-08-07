/**
 * Some provider keys are stored in the Vercel project under a non-canonical
 * name (e.g. `Scrapingbee` / `Anthropic` rather than `SCRAPINGBEE_API_KEY` /
 * `ANTHROPIC_API_KEY`). The marketing pipeline used to paper over this with
 * inline `process.env.X || process.env.Y` fallbacks, but the Signal/SEO
 * pipeline read the canonical name only — so the fallback scraper silently
 * lost its credentials in production and degraded to a no-key path.
 *
 * Resolve every key through one alias-aware lookup so both pipelines agree.
 */
const ENV_ALIASES: Record<string, string[]> = {
  ANTHROPIC_API_KEY: ["Anthropic", "ANTHROPIC_KEY"],
  SCRAPINGBEE_API_KEY: ["Scrapingbee", "SCRAPINGBEE", "SCRAPING_BEE_API_KEY"],
  JINA_API_KEY: ["Jina", "JINA", "JINA_KEY"],
  // The project also carries a second DataForSEO pair under `*_2` names. The
  // canonical DATAFORSEO_LOGIN has gone missing from the env store more than
  // once while DATAFORSEO_LOGIN_2 held the correct account email, which left
  // the SEO pull unauthenticated (401 40100) and silently degraded. Falling
  // back keeps the scraper working from whichever name is populated.
  DATAFORSEO_LOGIN: ["DATAFORSEO_LOGIN_2", "DATAFORSEO_EMAIL"],
  DATAFORSEO_PASSWORD: ["DATAFORSEO_PASSWORD_2", "DATAFORSEO_API_PASSWORD"],
}

/**
 * Read an env var by its canonical name, falling back to any known aliases.
 * Blank/whitespace-only values are treated as unset so a stray empty variable
 * in one environment can't shadow a valid alias.
 */
export function resolveEnv(name: string): string | undefined {
  for (const candidate of [name, ...(ENV_ALIASES[name] ?? [])]) {
    const value = process.env[candidate]
    if (value && value.trim()) return value
  }
  return undefined
}

/** Names actually checked for a key — useful for diagnostics, never logs values. */
export function envCandidateNames(name: string): string[] {
  return [name, ...(ENV_ALIASES[name] ?? [])]
}

export function requireEnv(name: string): string {
  const value = resolveEnv(name)
  if (!value) {
    throw new Error(`${name} is required for Hubbly Signal.`)
  }
  return value
}

export function optionalEnv(name: string): string | undefined {
  return resolveEnv(name)
}

export function getDataForSeoEnv(): { login?: string; password?: string } {
  return {
    login: optionalEnv("DATAFORSEO_LOGIN"),
    password: optionalEnv("DATAFORSEO_PASSWORD")
  }
}
