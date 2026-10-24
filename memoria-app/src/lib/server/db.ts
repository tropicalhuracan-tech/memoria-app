import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl } from "@/lib/server/env";

let schemaReady: Promise<void> | null = null;

export function sql() {
  return neon(getDatabaseUrl());
}

export async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const db = sql();
      await db`
        CREATE TABLE IF NOT EXISTS memoria_users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          backup_salt TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await db`
        CREATE TABLE IF NOT EXISTS memoria_backups (
          user_id TEXT PRIMARY KEY REFERENCES memoria_users(id) ON DELETE CASCADE,
          ciphertext TEXT NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await db`
        CREATE TABLE IF NOT EXISTS safe_shares (
          id TEXT PRIMARY KEY,
          ciphertext TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL
        )
      `;
    })();
  }
  await schemaReady;
}
