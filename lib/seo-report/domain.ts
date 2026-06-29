export function normalizeDomain(input: string): { domain: string; url: string } {
  const trimmed = input.trim().toLowerCase();
  const withProtocol = /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);
  const domain = parsed.hostname.replace(/^www\./, "");

  if (!domain.includes(".") || domain.length < 4) {
    throw new Error("Enter a valid company domain.");
  }

  return {
    domain,
    url: `https://${domain}`
  };
}
