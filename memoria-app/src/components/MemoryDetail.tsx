"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { X, MapPin, ExternalLink, Trash2 } from "lucide-react";
import type { MemoryRecord } from "@/types/memory";
import { kindLabel } from "@/lib/memory-search";
import { mapsUrl } from "@/lib/media";
import { deleteMemory } from "@/lib/db";

interface Props {
  memory: MemoryRecord;
  onClose: () => void;
  onDeleted: () => void;
}

export function MemoryDetail({ memory, onClose, onDeleted }: Props) {
  const hasCoords =
    typeof memory.latitude === "number" && typeof memory.longitude === "number";

  async function handleDelete() {
    if (!confirm(`¿Eliminar «${memory.title}»?`)) return;
    await deleteMemory(memory.id);
    onDeleted();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-zinc-950/60 backdrop-blur-sm">
      <div className="mx-auto mt-auto flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-2xl dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-violet-600">
              {kindLabel(memory.kind)}
            </p>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{memory.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-zinc-100 p-2 dark:bg-zinc-800"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {memory.mediaDataUrl && (memory.kind === "photo" || memory.kind === "object") && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={memory.mediaDataUrl}
              alt={memory.title}
              className="mb-4 w-full rounded-2xl object-cover shadow-md"
            />
          )}

          {memory.body && (
            <section className="mb-4 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/60">
              <p className="text-xs font-semibold text-zinc-500">Detalle</p>
              <p className="mt-1 whitespace-pre-wrap text-zinc-800 dark:text-zinc-100">{memory.body}</p>
            </section>
          )}

          {memory.locationLabel && (
            <section className="mb-4 rounded-2xl border border-violet-100 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/40">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">Ubicación</p>
                  <p className="mt-1 break-words text-zinc-800 dark:text-zinc-100">{memory.locationLabel}</p>
                  {hasCoords && (
                    <a
                      href={mapsUrl(memory.latitude!, memory.longitude!)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Abrir en mapas
                    </a>
                  )}
                </div>
              </div>
            </section>
          )}

          {memory.meetingAt && (
            <p className="mb-4 text-sm font-medium">
              🗓 {format(parseISO(memory.meetingAt), "EEEE d MMMM yyyy, HH:mm", { locale: es })}
            </p>
          )}

          {memory.mediaDataUrl && memory.kind === "voice" && (
            <section className="mb-4 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/60">
              <p className="mb-2 text-xs font-semibold text-zinc-500">Nota de voz</p>
              <audio controls className="w-full" src={memory.mediaDataUrl} preload="metadata">
                <track kind="captions" />
              </audio>
            </section>
          )}

          {memory.kind === "password" && (
            <p className="mb-4 text-sm text-zinc-600">🔐 Contraseña cifrada — pregunta en el Chat con la bóveda desbloqueada.</p>
          )}

          {memory.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {memory.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-violet-100 px-3 py-1 text-xs text-violet-800 dark:bg-violet-900 dark:text-violet-100"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p className="mt-6 text-center text-xs text-zinc-400">
            Guardado el {format(parseISO(memory.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
          </p>
        </div>

        <div className="border-t border-zinc-100 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:border-zinc-800">
          <button
            type="button"
            onClick={handleDelete}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm text-red-600 dark:border-red-900"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar recuerdo
          </button>
        </div>
      </div>
    </div>
  );
}
