export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for Hubbly Signal.`);
  }
  return value;
}

export function optionalEnv(name: string): string | undefined {
  return process.env[name] || undefined;
}

export function getDataForSeoEnv(): { login?: string; password?: string } {
  return {
    login: optionalEnv("DATAFORSEO_LOGIN"),
    password: optionalEnv("DATAFORSEO_PASSWORD")
  };
}
