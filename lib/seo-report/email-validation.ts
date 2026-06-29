const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isValidEmail(value: unknown): boolean {
  return emailPattern.test(normalizeEmail(value));
}
