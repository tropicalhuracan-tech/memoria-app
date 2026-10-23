"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Brain,
  MessageCircle,
  Settings2,
  List,
  Plus,
} from "lucide-react";
import { getAllMemories } from "@/lib/db";
import type { MemoryRecord } from "@/types/memory";
import { MemoryForm } from "@/components/MemoryForm";
import { MemoryCard } from "@/components/MemoryCard";
import { MemoryDetail } from "@/components/MemoryDetail";
import { ChatPanel } from "@/components/ChatPanel";
import { VaultSettings } from "@/components/VaultSettings";
import { CloudAccount } from "@/components/CloudAccount";
import { InstallPrompt } from "@/components/InstallPrompt";
import { isVaultUnlocked } from "@/lib/vault";
import { format, isFuture, parseISO } from "date-fns";
import { es } from "date-fns/locale";

type Tab = "home" | "memories" | "chat" | "account";

export function MemoriaApp() {
  const [tab, setTab] = useState<Tab>("home");
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [vaultReady, setVaultReady] = useState(false);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<MemoryRecord | null>(null);

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
    <div className="app-shell memoria-bg mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-[calc(0.75rem+env(safe-area-inset-top))]">
      <header className="mb-4">
        <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 p-3 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/80">
          <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 p-2.5 text-white shadow-lg ring-2 ring-violet-200/50">
            <Brain className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Memoria
            </h1>
            <p className="text-xs text-violet-700/80 dark:text-violet-300">Tu segundo cerebro 🧠</p>
          </div>
        </div>
      </header>

      <InstallPrompt />

      {tab === "home" && (
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-4 text-lg font-semibold text-white shadow-lg active:scale-[0.98]"
          >
            <Plus className="h-6 w-6" />
            Guardar ahora
          </button>

          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Próximo
            </h2>
            {upcoming.length === 0 ? (
              <p className="rounded-xl bg-zinc-100 p-4 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                Sin reuniones. Toca Guardar → Reunión.
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
                      {format(parseISO(m.meetingAt!), "EEE d MMM, HH:mm", { locale: es })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Recientes
            </h2>
            <div className="space-y-3">
              {memories.slice(0, 4).map((m) => (
                <MemoryCard key={m.id} memory={m} onOpen={setSelected} />
              ))}
              {memories.length === 0 && (
                <p className="text-sm text-zinc-500">
                  Foto de las llaves, nota de voz o clave WiFi — lo que olvidas siempre.
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      {tab === "memories" && (
        <div className="space-y-4">
          <input
            className="min-h-[48px] w-full rounded-xl border border-violet-100 bg-white/90 px-4 text-base shadow-sm dark:border-zinc-600 dark:bg-zinc-800"
            placeholder="Buscar…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div className="space-y-3 pb-2">
            {filtered.map((m) => (
              <MemoryCard key={m.id} memory={m} onOpen={setSelected} />
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-zinc-500">Nada coincide con la búsqueda.</p>
            )}
          </div>
        </div>
      )}

      {tab === "chat" && <ChatPanel vaultReady={vaultReady} />}

      {tab === "account" && (
        <div className="space-y-4">
          <CloudAccount onSync={refresh} />
          <VaultSettings onChange={refresh} />
          <section className="rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
            <p>
              <strong className="text-zinc-900 dark:text-zinc-100">En el celular:</strong> usa el
              micrófono del chat, la cámara al guardar fotos y instala la app desde el banner.
            </p>
            <p className="mt-2">
              <strong className="text-zinc-900 dark:text-zinc-100">Nube:</strong> backup cifrado;
              inicia sesión con el mismo correo en otro teléfono para recuperar todo.
            </p>
          </section>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-violet-100 bg-white/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(124,58,237,0.08)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="relative mx-auto flex h-[4.25rem] max-w-md items-end justify-between px-2">
          {(
            [
              ["home", "Inicio", Brain],
              ["memories", "Lista", List],
              ["chat", "Chat", MessageCircle],
              ["account", "Cuenta", Settings2],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex min-h-[44px] min-w-[64px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] ${
                tab === id ? "text-violet-600" : "text-zinc-500"
              }`}
            >
              <Icon className="h-6 w-6" />
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="absolute left-1/2 top-0 flex h-14 w-14 -translate-x-1/2 -translate-y-4 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-500 text-white shadow-xl ring-4 ring-white active:scale-95 dark:ring-zinc-800"
            aria-label="Guardar recuerdo"
          >
            <Plus className="h-7 w-7" />
          </button>
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

      {selected && (
        <MemoryDetail
          memory={selected}
          onClose={() => setSelected(null)}
          onDeleted={() => {
            refresh();
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
