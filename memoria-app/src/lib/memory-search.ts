import type { MemoryRecord } from "@/types/memory";
import { format, isFuture, isPast, parseISO } from "date-fns";
import { es } from "date-fns/locale";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function tokenize(query: string): string[] {
  return normalize(query)
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

export interface SearchHit {
  memory: MemoryRecord;
  score: number;
  reasons: string[];
}

export function searchMemories(memories: MemoryRecord[], query: string): SearchHit[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const hits: SearchHit[] = [];

  for (const memory of memories) {
    const haystack = normalize(
      [memory.title, memory.body, memory.locationLabel ?? "", memory.tags.join(" ")].join(" "),
    );
    let score = 0;
    const reasons: string[] = [];

    for (const token of tokens) {
      if (haystack.includes(token)) {
        score += 3;
        reasons.push(`coincide «${token}»`);
      }
    }

    if (memory.kind === "meeting" && memory.meetingAt) {
      const when = parseISO(memory.meetingAt);
      const q = normalize(query);
      if (q.includes("proxim") || q.includes("reunion") || q.includes("cita")) {
        if (isFuture(when)) {
          score += 2;
          reasons.push("reunión futura");
        }
      }
      if (q.includes("pasad") && isPast(when)) score += 1;
    }

    if (memory.kind === "object" && (query.includes("dónde") || query.includes("donde"))) {
      score += 1;
      if (memory.locationLabel) reasons.push("tiene ubicación");
    }

    if (score > 0) hits.push({ memory, score, reasons });
  }

  return hits.sort((a, b) => b.score - a.score);
}

export function formatMemoryForChat(memory: MemoryRecord, includeSecret = false): string {
  const lines: string[] = [`**${memory.title}** (${kindLabel(memory.kind)})`];

  if (memory.body) lines.push(memory.body);
  if (memory.locationLabel) lines.push(`📍 ${memory.locationLabel}`);
  if (memory.meetingAt) {
    lines.push(
      `🗓 ${format(parseISO(memory.meetingAt), "EEEE d MMMM yyyy, HH:mm", { locale: es })}`,
    );
  }
  if (memory.tags.length) lines.push(`Etiquetas: ${memory.tags.join(", ")}`);
  if (includeSecret && memory.secretCipher) {
    lines.push("(contraseña guardada — desbloquea la bóveda para verla en detalle)");
  }
  lines.push(`Guardado el ${format(parseISO(memory.createdAt), "d/M/yyyy HH:mm", { locale: es })}`);
  return lines.join("\n");
}

export function kindLabel(kind: MemoryRecord["kind"]): string {
  const map: Record<MemoryRecord["kind"], string> = {
    object: "Objeto / lugar",
    password: "Clave",
    meeting: "Reunión",
    photo: "Foto",
    voice: "Nota de voz",
    note: "Nota",
  };
  return map[kind];
}
