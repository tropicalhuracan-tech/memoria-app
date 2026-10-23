const VAULT_KEY = "memoria-vault-salt";
const SESSION_KEY = "memoria-vault-unlocked";

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const saltBytes = new Uint8Array(salt);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltBytes, iterations: 120_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function getOrCreateSalt(): Uint8Array {
  const existing = localStorage.getItem(VAULT_KEY);
  if (existing) return new Uint8Array(base64ToBuffer(existing));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem(VAULT_KEY, bufferToBase64(salt.buffer));
  return salt;
}

let cachedKey: CryptoKey | null = null;

export function isVaultConfigured(): boolean {
  return Boolean(localStorage.getItem(VAULT_KEY));
}

export function isVaultUnlocked(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === "1" && cachedKey !== null;
}

export async function unlockVault(passphrase: string): Promise<boolean> {
  const salt = getOrCreateSalt();
  try {
    cachedKey = await deriveKey(passphrase, salt);
    sessionStorage.setItem(SESSION_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

export function lockVault(): void {
  cachedKey = null;
  sessionStorage.removeItem(SESSION_KEY);
}

export async function encryptSecret(plain: string): Promise<string> {
  if (!cachedKey) throw new Error("Bóveda bloqueada");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cachedKey,
    enc.encode(plain),
  );
  const combined = new Uint8Array(iv.length + new Uint8Array(cipher).length);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), iv.length);
  return bufferToBase64(combined.buffer);
}

export async function decryptSecret(cipherB64: string): Promise<string> {
  if (!cachedKey) throw new Error("Bóveda bloqueada");
  const combined = new Uint8Array(base64ToBuffer(cipherB64));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cachedKey, data);
  return new TextDecoder().decode(dec);
}
