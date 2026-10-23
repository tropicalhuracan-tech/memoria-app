import type { ChatMessage, MemoryRecord } from "@/types/memory";
import { deriveSyncKey, decryptPayload, encryptPayload } from "@/lib/backup-crypto";
import { appendChatMessage, db, getAllMemories, getChatHistory, saveMemory } from "@/lib/db";

const AUTH_PASS_KEY = "memoria-cloud-pass";
const AUTH_SALT_KEY = "memoria-cloud-salt";

export interface CloudSession {
  email: string;
  backupSalt: string;
}

export interface BackupBundle {
  version: 1;
  exportedAt: string;
  memories: MemoryRecord[];
  chat: ChatMessage[];
}

export function storeCloudCredentials(password: string, backupSalt: string): void {
  sessionStorage.setItem(AUTH_PASS_KEY, password);
  sessionStorage.setItem(AUTH_SALT_KEY, backupSalt);
}

export function clearCloudCredentials(): void {
  sessionStorage.removeItem(AUTH_PASS_KEY);
  sessionStorage.removeItem(AUTH_SALT_KEY);
}

export function hasCloudCredentials(): boolean {
  return Boolean(sessionStorage.getItem(AUTH_PASS_KEY) && sessionStorage.getItem(AUTH_SALT_KEY));
}

async function syncKeyFromSession(): Promise<CryptoKey | null> {
  const password = sessionStorage.getItem(AUTH_PASS_KEY);
  const salt = sessionStorage.getItem(AUTH_SALT_KEY);
  if (!password || !salt) return null;
  return deriveSyncKey(password, salt);
}

export async function fetchMe(): Promise<{
  configured: boolean;
  user: CloudSession | null;
}> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  return res.json();
}

export async function registerCloud(email: string, password: string): Promise<CloudSession> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "No se pudo registrar");
  storeCloudCredentials(password, data.backupSalt);
  return { email: data.email, backupSalt: data.backupSalt };
}

export async function loginCloud(email: string, password: string): Promise<CloudSession> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "No se pudo iniciar sesión");
  storeCloudCredentials(password, data.backupSalt);
  return { email: data.email, backupSalt: data.backupSalt };
}

export async function logoutCloud(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
  clearCloudCredentials();
}

async function buildBundle(): Promise<BackupBundle> {
  const memories = await getAllMemories();
  const chat = await getChatHistory(200);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    memories,
    chat,
  };
}

export async function pushCloudBackup(): Promise<void> {
  const key = await syncKeyFromSession();
  if (!key) return;

  const bundle = await buildBundle();
  const ciphertext = await encryptPayload(key, JSON.stringify(bundle));

  const res = await fetch("/api/backup", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ ciphertext }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Error al subir copia");
  }
}

export async function pullCloudBackup(mode: "merge" | "replace" = "merge"): Promise<boolean> {
  const key = await syncKeyFromSession();
  if (!key) return false;

  const res = await fetch("/api/backup", { credentials: "include" });
  if (!res.ok) throw new Error("No se pudo descargar la copia");
  const data = (await res.json()) as { ciphertext: string | null };
  if (!data.ciphertext) return false;

  const json = await decryptPayload(key, data.ciphertext);
  const bundle = JSON.parse(json) as BackupBundle;
  if (bundle.version !== 1) throw new Error("Versión de copia no compatible");

  if (!db) return false;

  if (mode === "replace") {
    await db.memories.clear();
    await db.chat.clear();
  }

  for (const memory of bundle.memories) {
    await saveMemory(memory);
  }
  for (const msg of bundle.chat) {
    await appendChatMessage(msg);
  }

  return true;
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;

/** Sube copia cifrada unos segundos después del último cambio */
export function scheduleCloudBackup(): void {
  if (!hasCloudCredentials()) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushCloudBackup().catch(() => {
      /* silencioso: reintentará en el próximo cambio */
    });
  }, 2500);
}
