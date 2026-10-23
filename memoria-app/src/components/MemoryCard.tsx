"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, KeyRound, MapPin, Mic, Camera, Notebook, ChevronRight } from "lucide-react";
import type { MemoryRecord } from "@/types/memory";
import { kindLabel } from "@/lib/memory-search";

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
  onOpen: (memory: MemoryRecord) => void;
}

export function MemoryCard({ memory, onOpen }: Props) {
  const Icon = ICONS[memory.kind];
  const thumb =
    memory.mediaDataUrl && (memory.kind === "photo" || memory.kind === "object")
      ? memory.mediaDataUrl
      : null;

  return (
    <button
      type="button"
      onClick={() => onOpen(memory)}
      className="memoria-card w-full rounded-2xl border border-violet-100/80 bg-white p-4 text-left shadow-sm transition active:scale-[0.99] dark:border-violet-900/50 dark:bg-zinc-900"
    >
      <div className="flex items-start gap-3">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt=""
            className="h-14 w-14 shrink-0 rounded-xl object-cover ring-2 ring-violet-100 dark:ring-violet-800"
          />
        ) : (
          <div className="rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 p-2.5 text-white shadow">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{memory.title}</h3>
              <p className="text-xs text-violet-600 dark:text-violet-400">{kindLabel(memory.kind)}</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-zinc-400" />
          </div>
          {memory.body && (
            <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{memory.body}</p>
          )}
          {memory.locationLabel && (
            <p className="mt-1 truncate text-xs font-medium text-violet-700 dark:text-violet-300">
              📍 {memory.locationLabel}
            </p>
          )}
          {memory.kind === "voice" && memory.mediaDataUrl && (
            <p className="mt-1 text-xs text-emerald-600">🎙 Nota de voz guardada</p>
          )}
          {memory.meetingAt && (
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              🗓 {format(parseISO(memory.meetingAt), "EEE d MMM, HH:mm", { locale: es })}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
