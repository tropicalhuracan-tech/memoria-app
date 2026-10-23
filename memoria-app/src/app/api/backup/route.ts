import { NextResponse } from "next/server";
import { readSession } from "@/lib/server/auth";
import { ensureSchema, sql } from "@/lib/server/db";
import { isCloudConfigured } from "@/lib/server/env";

export async function GET() {
  if (!isCloudConfigured()) {
    return NextResponse.json({ error: "Nube no configurada" }, { status: 503 });
  }

  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
  }

  await ensureSchema();
  const db = sql();
  const rows = await db`
    SELECT ciphertext, updated_at
    FROM memoria_backups
    WHERE user_id = ${session.id}
    LIMIT 1
  `;
  const row = rows[0] as { ciphertext: string; updated_at: string } | undefined;
  if (!row) {
    return NextResponse.json({ ciphertext: null, updatedAt: null });
  }

  return NextResponse.json({
    ciphertext: row.ciphertext,
    updatedAt: row.updated_at,
  });
}

export async function PUT(request: Request) {
  if (!isCloudConfigured()) {
    return NextResponse.json({ error: "Nube no configurada" }, { status: 503 });
  }

  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
  }

  const body = (await request.json()) as { ciphertext?: string };
  if (!body.ciphertext || body.ciphertext.length > 15_000_000) {
    return NextResponse.json({ error: "Copia de seguridad inválida" }, { status: 400 });
  }

  await ensureSchema();
  const db = sql();
  await db`
    INSERT INTO memoria_backups (user_id, ciphertext, updated_at)
    VALUES (${session.id}, ${body.ciphertext}, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET ciphertext = EXCLUDED.ciphertext, updated_at = NOW()
  `;

  return NextResponse.json({ ok: true });
}
