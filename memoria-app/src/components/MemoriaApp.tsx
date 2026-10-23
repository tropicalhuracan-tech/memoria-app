"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Brain, MessageCircle, Plus, Settings2 } from "lucide-react";
import { getAllMemories } from "@/lib/db";
import type { MemoryRecord } from "@/types/memory";
import { MemoryForm } from "@/components/MemoryForm";
import { MemoryCard } from "@/components/MemoryCard";
import { ChatPanel } from "@/components/ChatPanel";
import { VaultSettings } from "@/components/VaultSettings";
import { isVaultUnlocked } from "@/lib/vault";
import { format, isFuture, parseISO } from "date-fns";
import { es } from "date-fns/locale";

type Tab = "home" | "memories" | "chat" | "settings";

export function MemoriaApp() {
  const [tab, setTab] = useState<Tab>("home");
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [vaultReady, setVaultReady] = useState(false);
  const [filter, setFilter] = useState("");

  const refresh = useCallback(async () => {
    setMemories(await getAllMemories());
    setVaultReady(isVaultUnlocked());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const upcoming = useMemo(
    () =>
      memories
        .filter((m) => m.kind === "meeting" && m.meetingAt && isFuture(parseISO(m.meetingAt)))
        .slice(0, 3),
    [memories],
  );

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return memories;
    return memories.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [memories, filter]);

  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col px-4 pb-24 pt-6">
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 p-3 text-white shadow-lg">
            <Brain className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Memoria
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Tu segundo cerebro: fotos, voz, claves y chat.
            </p>
          </div>
        </div>
      </header>

      {tab === "home" && (
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-4 text-lg font-semibold text-white shadow-md"
          >
            <Plus className="h-6 w-6" />
            Guardar algo ahora
          </button>

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Próximo en tu agenda
            </h2>
            {upcoming.length === 0 ? (
              <p className="rounded-xl bg-zinc-100 p-4 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                Sin reuniones guardadas. Añade una para no olvidarla.
              </p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-3 dark:border-violet-900 dark:bg-violet-950/40"
                  >
                    <p className="font-medium">{m.title}</p>
                    <p className="text-sm text-violet-800 dark:text-violet-200">
                      {format(parseISO(m.meetingAt!), "EEEE d MMM, HH:mm", { locale: es })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Recientes
            </h2>
            <div className="space-y-3">
              {memories.slice(0, 3).map((m) => (
                <MemoryCard key={m.id} memory={m} onDeleted={refresh} />
              ))}
              {memories.length === 0 && (
                <p className="text-sm text-zinc-500">
                  Empieza con una foto de dónde dejaste las llaves o una nota de voz.
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      {tab === "memories" && (
        <div className="space-y-4">
          <input
            className="w-full rounded-xl border border-zinc-300 px-4 py-2 dark:border-zinc-600 dark:bg-zinc-800"
            placeholder="Buscar en tus recuerdos…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div className="space-y-3">
            {filtered.map((m) => (
              <MemoryCard key={m.id} memory={m} onDeleted={refresh} />
            ))}
          </div>
        </div>
      )}

      {tab === "chat" && <ChatPanel vaultReady={vaultReady} />}

      {tab === "settings" && (
        <div className="space-y-4">
          <VaultSettings onChange={refresh} />
          <section className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
            <p>
              <strong className="text-zinc-900 dark:text-zinc-100">Privacidad:</strong> todo queda
              en este navegador (IndexedDB). No enviamos tus recuerdos a servidores.
            </p>
            <p className="mt-2">
              El chat busca localmente en lo que guardaste. Puedes conectar un modelo de IA más
              adelante con una clave API si quieres respuestas más naturales.
            </p>
          </section>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 border-t border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex max-w-3xl justify-around py-2">
          {(
            [
              ["home", "Inicio", Brain],
              ["memories", "Recuerdos", Plus],
              ["chat", "Chat", MessageCircle],
              ["settings", "Ajustes", Settings2],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${
                tab === id ? "text-violet-600" : "text-zinc-500"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {showForm && (
        <MemoryForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            refresh();
            setTab("memories");
          }}
        />
      )}
    </div>
  );
}
