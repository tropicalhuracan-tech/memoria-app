"use client";

import { useCallback, useEffect, useState } from "react";
import { Cloud, CloudOff, Download, Upload } from "lucide-react";
import {
  fetchMe,
  hasCloudCredentials,
  loginCloud,
  logoutCloud,
  pullCloudBackup,
  pushCloudBackup,
  registerCloud,
  storeCloudCredentials,
} from "@/lib/cloud-sync";

interface Props {
  onSync: () => void;
}

export function CloudAccount({ onSync }: Props) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [formEmail, setFormEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [reunlock, setReunlock] = useState("");
  const [backupSalt, setBackupSalt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const me = await fetchMe();
    setConfigured(me.configured);
    setEmail(me.user?.email ?? null);
    setBackupSalt(me.user?.backupSalt ?? null);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      if (mode === "register") {
        await registerCloud(formEmail, password);
        setStatus("Cuenta creada. Subiendo tu primera copia…");
        await pushCloudBackup();
      } else {
        await loginCloud(formEmail, password);
        setStatus("Descargando copia de la nube…");
        const restored = await pullCloudBackup("merge");
        onSync();
        setStatus(restored ? "Copia restaurada en este celular." : "Sesión iniciada (sin copia previa).");
      }
      setPassword("");
      await refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Error de cuenta");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await logoutCloud();
    setEmail(null);
    setStatus("Sesión cerrada en este dispositivo.");
  }

  async function handlePush() {
    setBusy(true);
    setStatus("");
    try {
      await pushCloudBackup();
      setStatus("Copia subida (cifrada).");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setBusy(false);
    }
  }

  async function handlePull() {
    setBusy(true);
    setStatus("");
    try {
      const ok = await pullCloudBackup("merge");
      onSync();
      setStatus(ok ? "Copia descargada." : "No hay copia en la nube todavía.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Error al bajar");
    } finally {
      setBusy(false);
    }
  }

  if (configured === null) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500">Comprobando nube…</p>
      </section>
    );
  }

  if (!configured) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
          <CloudOff className="h-5 w-5" />
          <h2 className="font-semibold">Backup en la nube</h2>
        </div>
        <p className="mt-2 text-sm text-amber-900/80 dark:text-amber-100/80">
          En Vercel configura <code className="text-xs">POSTGRES_URL</code> (Neon) y{" "}
          <code className="text-xs">AUTH_SECRET</code> para activar sincronización entre celulares.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center gap-2">
        <Cloud className="h-5 w-5 text-sky-600" />
        <h2 className="font-semibold">Cuenta y backup</h2>
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Tus recuerdos se cifran en el celular antes de subir. La nube solo guarda datos ilegibles.
      </p>

      {email ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm">
            Conectado como <strong>{email}</strong>
          </p>

          {backupSalt && !hasCloudCredentials() && (
            <form
              className="space-y-2 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50"
              onSubmit={(e) => {
                e.preventDefault();
                storeCloudCredentials(reunlock, backupSalt);
                setReunlock("");
                setStatus("Listo para sincronizar en esta sesión.");
              }}
            >
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Vuelve a escribir tu contraseña para cifrar/descifrar la copia en este celular.
              </p>
              <input
                type="password"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 dark:border-zinc-600 dark:bg-zinc-800"
                value={reunlock}
                onChange={(e) => setReunlock(e.target.value)}
                minLength={8}
                required
              />
              <button type="submit" className="w-full rounded-lg bg-violet-600 py-2 text-sm text-white">
                Activar sync
              </button>
            </form>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={handlePush}
              className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-medium text-white"
            >
              <Upload className="h-4 w-4" />
              Subir ahora
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handlePull}
              className="flex items-center justify-center gap-2 rounded-xl border border-zinc-300 py-3 text-sm dark:border-zinc-600"
            >
              <Download className="h-4 w-4" />
              Bajar
            </button>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-xl py-2 text-sm text-zinc-500 underline"
          >
            Cerrar sesión
          </button>
        </div>
      ) : (
        <form onSubmit={handleAuth} className="mt-4 space-y-3">
          <div className="flex gap-2 text-sm">
            <button
              type="button"
              className={`flex-1 rounded-lg py-2 ${mode === "login" ? "bg-violet-100 text-violet-800" : "bg-zinc-100"}`}
              onClick={() => setMode("login")}
            >
              Entrar
            </button>
            <button
              type="button"
              className={`flex-1 rounded-lg py-2 ${mode === "register" ? "bg-violet-100 text-violet-800" : "bg-zinc-100"}`}
              onClick={() => setMode("register")}
            >
              Crear cuenta
            </button>
          </div>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Correo"
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base dark:border-zinc-600 dark:bg-zinc-800"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            required
          />
          <input
            type="password"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            placeholder="Contraseña (mín. 8)"
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base dark:border-zinc-600 dark:bg-zinc-800"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-sky-600 py-3.5 text-base font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Conectando…" : mode === "register" ? "Crear y sincronizar" : "Entrar y restaurar"}
          </button>
        </form>
      )}

      {status && <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{status}</p>}
    </section>
  );
}
