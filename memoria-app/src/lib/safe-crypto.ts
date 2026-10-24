import { deriveSafeKey } from "@/lib/safe-pin";
import type { SafeSharePayload } from "@/types/safe";

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

export async function encryptWithPin(pin: string, plain: string): Promise<string> {
  const key = await deriveSafeKey(pin);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plain));
  const combined = new Uint8Array(iv.length + new Uint8Array(cipher).length);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), iv.length);
  return bufferToBase64(combined.buffer);
}

export async function decryptWithPin(pin: string, cipherB64: string): Promise<string> {
  const key = await deriveSafeKey(pin);
  const combined = new Uint8Array(base64ToBuffer(cipherB64));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(dec);
}

/** Cifrado para compartir: clave derivada solo del código de 4 dígitos (sin salt local) */
async function deriveShareKey(code: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const salt = enc.encode("memoria-share-v1");
  const base = await crypto.subtle.importKey("raw", enc.encode(code), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 120_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptSharePayload(code: string, payload: SafeSharePayload): Promise<string> {
  const key = await deriveShareKey(code);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(JSON.stringify(payload)),
  );
  const combined = new Uint8Array(iv.length + new Uint8Array(cipher).length);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), iv.length);
  return bufferToBase64(combined.buffer);
}

export async function decryptSharePayload(code: string, cipherB64: string): Promise<SafeSharePayload> {
  const key = await deriveShareKey(code);
  const combined = new Uint8Array(base64ToBuffer(cipherB64));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return JSON.parse(new TextDecoder().decode(dec)) as SafeSharePayload;
}

async function encryptWithShareKey(code: string, plain: string): Promise<string> {
  const key = await deriveShareKey(code);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plain));
  const combined = new Uint8Array(iv.length + new Uint8Array(cipher).length);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), iv.length);
  return bufferToBase64(combined.buffer);
}

async function decryptWithShareKey(code: string, cipherB64: string): Promise<string> {
  const key = await deriveShareKey(code);
  const combined = new Uint8Array(base64ToBuffer(cipherB64));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(dec);
}

export async function buildSharePayload(
  code: string,
  dataUrl: string,
  title: string,
  note: string,
): Promise<string> {
  const payload: SafeSharePayload = {
    v: 1,
    title,
    note,
    imageCipher: await encryptWithShareKey(code, dataUrl),
  };
  return encryptSharePayload(code, payload);
}

export async function openSharePayload(code: string, outerCipher: string): Promise<SafeSharePayload & { imageDataUrl: string }> {
  const payload = await decryptSharePayload(code, outerCipher);
  const imageDataUrl = await decryptWithShareKey(code, payload.imageCipher);
  return { ...payload, imageDataUrl };
}

export async function encryptImageForSafe(pin: string, dataUrl: string): Promise<string> {
  return encryptWithPin(pin, dataUrl);
}

export async function decryptImageFromSafe(pin: string, cipher: string): Promise<string> {
  return decryptWithPin(pin, cipher);
}
