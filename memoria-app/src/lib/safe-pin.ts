const PIN_SALT_KEY = "memoria-safe-pin-salt";
const PIN_HASH_KEY = "memoria-safe-pin-hash";
const SESSION_KEY = "memoria-safe-unlocked";

let sessionPin: string | null = null;

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return bufferToBase64(hash);
}

export function isSafePinConfigured(): boolean {
  return Boolean(localStorage.getItem(PIN_HASH_KEY));
}

export function isSafeUnlocked(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === "1" && sessionPin !== null;
}

export function getSessionPin(): string | null {
  return isSafeUnlocked() ? sessionPin : null;
}

export function lockSafe(): void {
  sessionPin = null;
  sessionStorage.removeItem(SESSION_KEY);
}

export function validatePinFormat(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

export async function setupSafePin(pin: string): Promise<void> {
  if (!validatePinFormat(pin)) throw new Error("El código debe ser 4 números");
  let salt = localStorage.getItem(PIN_SALT_KEY);
  if (!salt) {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    salt = bufferToBase64(bytes.buffer);
    localStorage.setItem(PIN_SALT_KEY, salt);
  }
  const hash = await sha256(`${salt}:${pin}`);
  localStorage.setItem(PIN_HASH_KEY, hash);
  sessionPin = pin;
  sessionStorage.setItem(SESSION_KEY, "1");
}

export async function unlockSafePin(pin: string): Promise<boolean> {
  if (!validatePinFormat(pin)) return false;
  const salt = localStorage.getItem(PIN_SALT_KEY);
  const expected = localStorage.getItem(PIN_HASH_KEY);
  if (!salt || !expected) return false;
  const hash = await sha256(`${salt}:${pin}`);
  if (hash !== expected) return false;
  sessionPin = pin;
  sessionStorage.setItem(SESSION_KEY, "1");
  return true;
}

function getPinSaltBytes(): Uint8Array {
  const existing = localStorage.getItem(PIN_SALT_KEY);
  if (existing) {
    const binary = atob(existing);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  return new TextEncoder().encode("memoria-safe-fallback");
}

export async function deriveSafeKey(pin: string): Promise<CryptoKey> {
  const saltBytes = getPinSaltBytes();
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, ["deriveKey"]);
  const salt = new Uint8Array(saltBytes);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 180_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
