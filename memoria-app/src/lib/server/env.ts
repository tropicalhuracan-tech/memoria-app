export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET no está configurado");
  }
  return secret;
}

export function getDatabaseUrl(): string {
  const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error("POSTGRES_URL / DATABASE_URL no está configurado");
  }
  return url;
}

export function isCloudConfigured(): boolean {
  return Boolean(process.env.POSTGRES_URL ?? process.env.DATABASE_URL) && Boolean(process.env.AUTH_SECRET);
}
