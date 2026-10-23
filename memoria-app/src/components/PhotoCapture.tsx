"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { compressImageFile } from "@/lib/media";

interface Props {
  label?: string;
  previewUrl?: string;
  onCapture: (dataUrl: string) => void;
  onClear?: () => void;
}

export function PhotoCapture({ label = "Foto", previewUrl, onCapture, onClear }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function handleFile(file: File | null) {
    if (!file) return;
    setErr("");
    setBusy(true);
    try {
      const dataUrl = await compressImageFile(file);
      onCapture(dataUrl);
    } catch {
      setErr("No se pudo usar la imagen. Prueba otra foto.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{label}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => cameraRef.current?.click()}
          className="flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-md active:scale-[0.98]"
        >
          <Camera className="h-6 w-6" />
          Abrir cámara
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => galleryRef.current?.click()}
          className="flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl border-2 border-violet-200 bg-violet-50 py-3 text-sm font-semibold text-violet-800 active:scale-[0.98] dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-100"
        >
          <ImagePlus className="h-6 w-6" />
          Galería
        </button>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          handleFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          handleFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />

      {busy && <p className="mt-2 text-xs text-violet-600">Procesando foto…</p>}
      {err && <p className="mt-2 text-xs text-red-600">{err}</p>}

      {previewUrl && (
        <div className="relative mt-3 overflow-hidden rounded-2xl ring-2 ring-violet-200 dark:ring-violet-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Vista previa" className="max-h-56 w-full object-cover" />
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-2 top-2 rounded-full bg-black/50 px-3 py-1 text-xs text-white"
            >
              Quitar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
