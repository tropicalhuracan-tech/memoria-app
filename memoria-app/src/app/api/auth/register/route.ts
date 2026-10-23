import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { newId } from "@/lib/id";
import { ensureSchema, sql } from "@/lib/server/db";
import { createSessionToken, setSessionCookie } from "@/lib/server/auth";
import { isCloudConfigured } from "@/lib/server/env";

function randomSaltB64(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  let binary = "";
  for (let i = 0; i < salt.length; i++) binary += String.fromCharCode(salt[i]!);
  return btoa(binary);
}

export async function POST(request: Request) {
  if (!isCloudConfigured()) {
    return NextResponse.json({ error: "Nube no configurada en el servidor" }, { status: 503 });
  }

  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 });
  }

  await ensureSchema();
  const db = sql();
  const id = newId();
  const passwordHash = await bcrypt.hash(password, 12);
  const backupSalt = randomSaltB64();

  try {
    await db`
      INSERT INTO memoria_users (id, email, password_hash, backup_salt)
      VALUES (${id}, ${email}, ${passwordHash}, ${backupSalt})
    `;
  } catch {
    return NextResponse.json({ error: "Ese correo ya está registrado" }, { status: 409 });
  }

  const token = await createSessionToken({ id, email });
  await setSessionCookie(token);

  return NextResponse.json({ email, backupSalt });
}
