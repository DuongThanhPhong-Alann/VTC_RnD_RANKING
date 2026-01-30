export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Create .env.local with ${name}=...`,
    );
  }
  return value;
}

