// Single source of truth for the LLM generation model (CLAUDE.md invariant:
// "LLM generation model is a named constant per service; never hardcode model
// strings at call sites"). Swap in one place.
export const generationModel = "claude-sonnet-4-6";
