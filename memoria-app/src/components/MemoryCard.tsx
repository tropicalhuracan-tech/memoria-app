"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, KeyRound, MapPin, Mic, Camera, Notebook, Trash2 } from "lucide-react";
import type { MemoryRecord } from "@/types/memory";
import { kindLabel } from "@/lib/memory-search";
import { deleteMemory } from "@/lib/db";

const ICONS = {
  object: MapPin,
  password: KeyRound,
  meeting: Calendar,
  photo: Camera,
  voice: Mic,
  note: Notebook,
};

interface Props {
  memory: MemoryRecord;
  onDeleted: () => void;
}

export function MemoryCard({ memory, onDeleted }: Props) {
  const Icon = ICONS[memory.kind];

  async function handleDelete() {
    if (!confirm(`¿Eliminar «${memory.title}»?`)) return;
    await deleteMemory(memory.id);
    onDeleted();
  }

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-violet-100 p-2 text-violet-700 dark:bg-violet-950 dark:text-violet-200">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{memory.title}</h3>
            <p className="text-xs text-zinc-500">{kindLabel(memory.kind)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600"
          aria-label="Eliminar"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {memory.body && <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">{memory.body}</p>}
      {memory.locationLabel && (
        <p className="mt-2 text-sm text-violet-700 dark:text-violet-300">📍 {memory.locationLabel}</p>
      )}
      {memory.meetingAt && (
        <p className="mt-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
          🗓 {format(parseISO(memory.meetingAt), "EEEE d MMM yyyy, HH:mm", { locale: es })}
        </p>
      )}
      {memory.mediaDataUrl && memory.kind === "photo" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={memory.mediaDataUrl}
          alt={memory.title}
          className="mt-3 max-h-48 w-full rounded-xl object-cover"
        />
      )}
      {memory.mediaDataUrl && memory.kind === "voice" && (
        <audio controls className="mt-3 w-full" src={memory.mediaDataUrl}>
          <track kind="captions" />
        </audio>
      )}
      {memory.kind === "password" && (
        <p className="mt-2 text-sm text-zinc-500">🔐 Contraseña cifrada en la bóveda</p>
      )}
      {memory.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {memory.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
