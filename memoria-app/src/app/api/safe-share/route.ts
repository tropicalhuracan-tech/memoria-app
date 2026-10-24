import { NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/server/db";
import { isCloudConfigured } from "@/lib/server/env";
import { newId } from "@/lib/id";

export async function POST(request: Request) {
  if (!isCloudConfigured()) {
    return NextResponse.json({ error: "Nube no configurada" }, { status: 503 });
  }

  const body = (await request.json()) as { ciphertext?: string; hours?: number };
  if (!body.ciphertext || body.ciphertext.length > 12_000_000) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const hours = Math.min(Math.max(body.hours ?? 48, 1), 168);
  const id = newId().replace(/-/g, "").slice(0, 12);
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

  await ensureSchema();
  const db = sql();
  await db`
    INSERT INTO safe_shares (id, ciphertext, expires_at)
    VALUES (${id}, ${body.ciphertext}, ${expiresAt})
  `;

  return NextResponse.json({ shareId: id, expiresHours: hours });
}

export async function GET(request: Request) {
  if (!isCloudConfigured()) {
    return NextResponse.json({ error: "Nube no configurada" }, { status: 503 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  await ensureSchema();
  const db = sql();
  const rows = await db`
    SELECT ciphertext, expires_at FROM safe_shares WHERE id = ${id} LIMIT 1
  `;
  const row = rows[0] as { ciphertext: string; expires_at: string } | undefined;
  if (!row) return NextResponse.json({ error: "Enlace no encontrado o expirado" }, { status: 404 });

  if (new Date(row.expires_at) < new Date()) {
    await db`DELETE FROM safe_shares WHERE id = ${id}`;
    return NextResponse.json({ error: "Enlace expirado" }, { status: 410 });
  }

  return NextResponse.json({ ciphertext: row.ciphertext });
}
