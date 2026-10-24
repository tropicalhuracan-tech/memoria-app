import Dexie, { type Table } from "dexie";
import type { ChatMessage, MemoryRecord } from "@/types/memory";
import type { SafePhoto } from "@/types/safe";
import { scheduleCloudBackup } from "@/lib/cloud-sync";

export class MemoriaDatabase extends Dexie {
  memories!: Table<MemoryRecord, string>;
  chat!: Table<ChatMessage, string>;
  safePhotos!: Table<SafePhoto, string>;

  constructor() {
    super("memoria-app");
    this.version(1).stores({
      memories: "id, kind, title, createdAt, meetingAt, *tags",
      chat: "id, createdAt",
    });
    this.version(2).stores({
      safePhotos: "id, createdAt",
    });
  }
}

export const db = typeof window !== "undefined" ? new MemoriaDatabase() : null;

export async function getAllMemories(): Promise<MemoryRecord[]> {
  if (!db) return [];
  return db.memories.orderBy("createdAt").reverse().toArray();
}

export async function saveMemory(record: MemoryRecord): Promise<void> {
  if (!db) return;
  await db.memories.put(record);
  scheduleCloudBackup();
}

export async function deleteMemory(id: string): Promise<void> {
  if (!db) return;
  await db.memories.delete(id);
  scheduleCloudBackup();
}

export async function getChatHistory(limit = 50): Promise<ChatMessage[]> {
  if (!db) return [];
  return db.chat.orderBy("createdAt").reverse().limit(limit).toArray().then((rows) =>
    rows.reverse(),
  );
}

export async function appendChatMessage(msg: ChatMessage): Promise<void> {
  if (!db) return;
  await db.chat.put(msg);
  scheduleCloudBackup();
}

export async function getSafePhotos(): Promise<SafePhoto[]> {
  if (!db) return [];
  return db.safePhotos.orderBy("createdAt").reverse().toArray();
}

export async function saveSafePhoto(photo: SafePhoto): Promise<void> {
  if (!db) return;
  await db.safePhotos.put(photo);
}

export async function deleteSafePhoto(id: string): Promise<void> {
  if (!db) return;
  await db.safePhotos.delete(id);
}
