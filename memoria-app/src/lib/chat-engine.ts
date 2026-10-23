import { format, isFuture, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { MemoryRecord } from "@/types/memory";
import { decryptSecret } from "@/lib/vault";
import { formatMemoryForChat, searchMemories } from "@/lib/memory-search";

function upcomingMeetings(memories: MemoryRecord[]): MemoryRecord[] {
  return memories
    .filter((m) => m.kind === "meeting" && m.meetingAt && isFuture(parseISO(m.meetingAt)))
    .sort((a, b) => parseISO(a.meetingAt!).getTime() - parseISO(b.meetingAt!).getTime());
}

export interface ChatReply {
  text: string;
  relatedIds: string[];
}

export async function answerMemoryQuestion(
  question: string,
  memories: MemoryRecord[],
): Promise<ChatReply> {
  const q = question.trim();
  const lower = q.toLowerCase();

  if (!memories.length) {
    return {
      text: "Aún no tienes recuerdos guardados. Usa el botón **+ Guardar** para anotar llaves, claves, reuniones o una foto de dónde dejaste algo.",
      relatedIds: [],
    };
  }

  if (/pr[oó]xim|siguiente|qu[eé] tengo|agenda|reuniones/i.test(q)) {
    const upcoming = upcomingMeetings(memories);
    if (!upcoming.length) {
      return { text: "No veo reuniones futuras guardadas. ¿Quieres crear una?", relatedIds: [] };
    }
    const lines = upcoming.slice(0, 5).map((m) => {
      const when = format(parseISO(m.meetingAt!), "EEEE d MMM, HH:mm", { locale: es });
      return `• **${m.title}** — ${when}${m.body ? `\n  ${m.body}` : ""}`;
    });
    return {
      text: `Estas son tus próximas reuniones:\n\n${lines.join("\n\n")}`,
      relatedIds: upcoming.slice(0, 5).map((m) => m.id),
    };
  }

  if (/cu[aá]nt|cuantos|resumen|todo lo que/i.test(q)) {
    const byKind = memories.reduce<Record<string, number>>((acc, m) => {
      acc[m.kind] = (acc[m.kind] ?? 0) + 1;
      return acc;
    }, {});
    const parts = Object.entries(byKind).map(([k, n]) => `${k}: ${n}`);
    return {
      text: `Tienes **${memories.length}** recuerdos en total (${parts.join(", ")}). Pregúntame algo concreto, por ejemplo «¿dónde dejé las llaves?».`,
      relatedIds: [],
    };
  }

  const hits = searchMemories(memories, q).slice(0, 5);

  if (!hits.length) {
    return {
      text: "No encontré nada que encaje con eso. Prueba con otras palabras (nombre del objeto, sitio o persona) o guarda un recuerdo nuevo.",
      relatedIds: [],
    };
  }

  const blocks: string[] = [];
  const relatedIds: string[] = [];

  for (const hit of hits) {
    relatedIds.push(hit.memory.id);
    let block = formatMemoryForChat(hit.memory);

    if (
      hit.memory.kind === "password" &&
      hit.memory.secretCipher &&
      /clave|contrase|password|wifi|pin/i.test(lower)
    ) {
      try {
        const secret = await decryptSecret(hit.memory.secretCipher);
        block += `\n🔐 Contraseña: \`${secret}\``;
      } catch {
        block +=
          "\n🔐 Hay una contraseña guardada, pero la bóveda está bloqueada. Desbloquéala en Ajustes.";
      }
    }

    if (hit.memory.kind === "voice" && hit.memory.body) {
      block += `\n🎙 Transcripción: ${hit.memory.body}`;
    }

    blocks.push(block);
  }

  const intro =
    hits.length === 1
      ? "Esto es lo que encontré:"
      : `Encontré ${hits.length} recuerdos que pueden ayudarte:`;

  return { text: `${intro}\n\n${blocks.join("\n\n---\n\n")}`, relatedIds };
}
