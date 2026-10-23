export type MemoryKind =
  | "object"
  | "password"
  | "meeting"
  | "photo"
  | "voice"
  | "note";

export interface MemoryRecord {
  id: string;
  kind: MemoryKind;
  title: string;
  body: string;
  tags: string[];
  /** Base64 data URL for photo or audio */
  mediaDataUrl?: string;
  /** Encrypted payload for passwords (AES-GCM) */
  secretCipher?: string;
  locationLabel?: string;
  latitude?: number;
  longitude?: number;
  meetingAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  relatedMemoryIds?: string[];
}
