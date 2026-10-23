import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/server/db";
import { createSessionToken, setSessionCookie } from "@/lib/server/auth";
import { isCloudConfigured } from "@/lib/server/env";

export async function POST(request: Request) {
  if (!isCloudConfigured()) {
    return NextResponse.json({ error: "Nube no configurada en el servidor" }, { status: 503 });
  }

  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Correo y contraseña requeridos" }, { status: 400 });
  }

  await ensureSchema();
  const db = sql();
  const rows = await db`
    SELECT id, email, password_hash, backup_salt
    FROM memoria_users
    WHERE email = ${email}
    LIMIT 1
  `;
  const user = rows[0] as
    | { id: string; email: string; password_hash: string; backup_salt: string }
    | undefined;

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  const token = await createSessionToken({ id: user.id, email: user.email });
  await setSessionCookie(token);

  return NextResponse.json({ email: user.email, backupSalt: user.backup_salt });
}
