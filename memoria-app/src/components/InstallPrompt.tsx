"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("memoria-install-dismiss");
    if (dismissed) setHidden(true);

    function onBip(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (hidden || !deferred) return null;

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setDeferred(null);
  }

  function dismiss() {
    localStorage.setItem("memoria-install-dismiss", "1");
    setHidden(true);
  }

  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-800 dark:bg-violet-950/40">
      <Download className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-violet-900 dark:text-violet-100">
          Instala Memoria en tu celular
        </p>
        <p className="mt-1 text-xs text-violet-800/80 dark:text-violet-200/80">
          Así abres como app, pantalla completa y acceso rápido desde el inicio.
        </p>
        <button
          type="button"
          onClick={install}
          className="mt-3 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Añadir a inicio
        </button>
      </div>
      <button type="button" onClick={dismiss} aria-label="Cerrar">
        <X className="h-5 w-5 text-violet-600" />
      </button>
    </div>
  );
}
