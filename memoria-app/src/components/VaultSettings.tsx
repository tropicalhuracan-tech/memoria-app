"use client";

import { useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { isVaultUnlocked, lockVault, unlockVault } from "@/lib/vault";

interface Props {
  onChange: () => void;
}

export function VaultSettings({ onChange }: Props) {
  const [pass, setPass] = useState("");
  const [unlocked, setUnlocked] = useState(isVaultUnlocked());
  const [error, setError] = useState("");

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const ok = await unlockVault(pass);
    if (!ok) {
      setError("No se pudo desbloquear. Intenta de nuevo.");
      return;
    }
    setUnlocked(true);
    setPass("");
    onChange();
  }

  function handleLock() {
    lockVault();
    setUnlocked(false);
    onChange();
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center gap-2">
        {unlocked ? (
          <Unlock className="h-5 w-5 text-emerald-600" />
        ) : (
          <Lock className="h-5 w-5 text-amber-600" />
        )}
        <h2 className="font-semibold">Bóveda de claves</h2>
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Tus contraseñas se cifran en este dispositivo. Usa una frase maestra que recuerdes; no la
        guardamos en la nube.
      </p>

      {unlocked ? (
        <button
          type="button"
          onClick={handleLock}
          className="mt-4 rounded-xl border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600"
        >
          Bloquear bóveda
        </button>
      ) : (
        <form onSubmit={handleUnlock} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="password"
            className="flex-1 rounded-xl border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
            placeholder="Frase maestra"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          <button type="submit" className="rounded-xl bg-violet-600 px-4 py-2 text-white">
            Desbloquear
          </button>
        </form>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}
