export function normalizeSignalKeyword(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/\b(\d+)\s*\/\s*(\d+)\b/g, "$1/$2")
    .replace(/[^a-z0-9\s/.'"-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
