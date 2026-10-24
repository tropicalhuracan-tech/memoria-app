"use client";

import { useState } from "react";
import { PinPad } from "@/components/PinPad";
import { SafeIllustration } from "@/components/SafeIllustration";
import { openSharePayload } from "@/lib/safe-crypto";
import { validatePinFormat } from "@/lib/safe-pin";
import { Download } from "lucide-react";

interface Props {
  shareId: string;
}

export function PublicSafeViewer({ shareId }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  async function unlock() {
    setError("");
    if (!validatePinFormat(code)) {
      setError("Introduce los 4 números que te dieron.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/safe-share?id=${encodeURIComponent(shareId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Enlace no válido");
      const opened = await openSharePayload(code, data.ciphertext);
      setTitle(opened.title);
      setNote(opened.note);
      setImageUrl(opened.imageDataUrl);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Código incorrecto o enlace expirado.",
      );
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  if (imageUrl) {
    return (
      <div className="memoria-bg flex min-h-[100dvh] flex-col bg-zinc-950 px-4 py-8 text-white">
        <div className="mx-auto w-full max-w-md flex-1">
          <p className="text-center text-sm text-amber-400">Memoria · vista segura</p>
          <h1 className="mt-2 text-center text-xl font-bold">{title}</h1>
          {note && <p className="mt-1 text-center text-sm text-zinc-400">{note}</p>}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            className="mt-6 w-full rounded-2xl shadow-2xl ring-2 ring-amber-500/30"
          />
          <a
            href={imageUrl}
            download={`memoria-${shareId}.jpg`}
            className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3.5 font-semibold text-zinc-900"
          >
            <Download className="h-5 w-5" />
            Guardar en el celular
          </a>
          <p className="mt-4 text-center text-xs text-zinc-500">
            No necesitas instalar la app. Esta vista expira cuando caduque el enlace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-black px-6 py-10 text-white">
      <SafeIllustration className="h-44 w-40" />
      <h1 className="mt-4 text-2xl font-bold text-amber-400">Foto protegida</h1>
      <p className="mt-2 max-w-xs text-center text-sm text-zinc-400">
        Alguien compartió una imagen contigo. Introduce el <strong className="text-amber-200">código de 4 números</strong> que te
        entregó. No hace falta instalar Memoria.
      </p>
      <div className="mt-8">
        <PinPad value={code} onChange={setCode} disabled={busy} />
      </div>
      {error && (
        <p className="mt-4 max-w-xs text-center text-sm text-red-400">{error}</p>
      )}
      <button
        type="button"
        disabled={busy || code.length !== 4}
        onClick={unlock}
        className="mt-8 w-full max-w-xs rounded-2xl bg-amber-500 py-3.5 text-lg font-semibold text-zinc-900 disabled:opacity-50"
      >
        {busy ? "Abriendo…" : "Ver foto"}
      </button>
    </div>
  );
}
