import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { readSession } from "@/lib/server/auth";
import { ensureSchema, sql } from "@/lib/server/db";
import { isCloudConfigured } from "@/lib/server/env";

export async function GET() {
  if (!isCloudConfigured()) {
    return NextResponse.json({ configured: false, user: null });
  }

  const session = await readSession();
  if (!session) {
    return NextResponse.json({ configured: true, user: null });
  }

  await ensureSchema();
  const db = sql();
  const rows = await db`
    SELECT email, backup_salt FROM memoria_users WHERE id = ${session.id} LIMIT 1
  `;
  const user = rows[0] as { email: string; backup_salt: string } | undefined;
  if (!user) {
    return NextResponse.json({ configured: true, user: null });
  }

  return NextResponse.json({
    configured: true,
    user: { email: user.email, backupSalt: user.backup_salt as string },
  });
}
