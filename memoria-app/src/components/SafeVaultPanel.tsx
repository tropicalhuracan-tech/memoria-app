"use client";

import { useCallback, useEffect, useState } from "react";
import { Lock, Share2, Download, Plus, X } from "lucide-react";
import { PinPad } from "@/components/PinPad";
import { SafeIllustration } from "@/components/SafeIllustration";
import { PhotoCapture } from "@/components/PhotoCapture";
import {
  isSafePinConfigured,
  isSafeUnlocked,
  lockSafe,
  setupSafePin,
  unlockSafePin,
  getSessionPin,
  validatePinFormat,
} from "@/lib/safe-pin";
import {
  buildSharePayload,
  decryptImageFromSafe,
  encryptImageForSafe,
  openSharePayload,
} from "@/lib/safe-crypto";
import { deleteSafePhoto, getSafePhotos, saveSafePhoto } from "@/lib/db";
import type { SafePhoto } from "@/types/safe";
import { newId } from "@/lib/id";

type Mode = "setup" | "unlock" | "open" | "add" | "share" | "receive";

export function SafeVaultPanel() {
  const [mode, setMode] = useState<Mode>("unlock");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [setupStep, setSetupStep] = useState<"enter" | "confirm">("enter");
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState<SafePhoto[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<SafePhoto | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [addTitle, setAddTitle] = useState("");
  const [addNote, setAddNote] = useState("");
  const [addImage, setAddImage] = useState<string | undefined>();

  const [shareCode, setShareCode] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [shareBusy, setShareBusy] = useState(false);

  const [recvId, setRecvId] = useState("");
  const [recvCode, setRecvCode] = useState("");
  const [recvPreview, setRecvPreview] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setPhotos(await getSafePhotos());
  }, []);

  useEffect(() => {
    if (!isSafePinConfigured()) setMode("setup");
    else if (isSafeUnlocked()) setMode("open");
    else setMode("unlock");
    refresh();

    const params = new URLSearchParams(window.location.search);
    const recibir = params.get("recibir");
    if (recibir) {
      setRecvId(recibir);
      setMode("receive");
    }
  }, [refresh]);

  useEffect(() => {
    async function loadPreviews() {
      const sessionPin = getSessionPin();
      if (!sessionPin || mode !== "open") return;
      const next: Record<string, string> = {};
      for (const p of photos) {
        try {
          next[p.id] = await decryptImageFromSafe(sessionPin, p.cipherImage);
        } catch {
          /* skip */
        }
      }
      setPreviews(next);
    }
    loadPreviews();
  }, [photos, mode]);

  async function onSetupComplete() {
    setError("");
    if (setupStep === "enter") {
      if (!validatePinFormat(pin)) {
        setError("Usa exactamente 4 números.");
        return;
      }
      setSetupStep("confirm");
      setConfirmPin("");
      return;
    }
    if (pin !== confirmPin) {
      setError("Los códigos no coinciden.");
      setConfirmPin("");
      return;
    }
    await setupSafePin(pin);
    setPin("");
    setConfirmPin("");
    setSetupStep("enter");
    setMode("open");
    await refresh();
  }

  async function onUnlock() {
    setError("");
    if (!validatePinFormat(pin)) {
      setError("Introduce 4 números.");
      return;
    }
    const ok = await unlockSafePin(pin);
    if (!ok) {
      setError("Código incorrecto.");
      setPin("");
      return;
    }
    setPin("");
    setMode("open");
    await refresh();
  }

  async function saveNewPhoto() {
    const sessionPin = getSessionPin();
    if (!sessionPin || !addImage) {
      setError("Falta foto o sesión.");
      return;
    }
    setError("");
    const cipherImage = await encryptImageForSafe(sessionPin, addImage);
    await saveSafePhoto({
      id: newId(),
      title: addTitle.trim() || "Foto reservada",
      note: addNote.trim(),
      cipherImage,
      createdAt: new Date().toISOString(),
    });
    setAddTitle("");
    setAddNote("");
    setAddImage(undefined);
    setMode("open");
    await refresh();
  }

  async function openPhoto(p: SafePhoto) {
    const sessionPin = getSessionPin();
    if (!sessionPin) return;
    try {
      const url = await decryptImageFromSafe(sessionPin, p.cipherImage);
      setSelected(p);
      setPreviewUrl(url);
    } catch {
      setError("No se pudo abrir la foto.");
    }
  }

  async function publishShare() {
    if (!selected || !validatePinFormat(shareCode)) {
      setError("El código para compartir debe ser 4 números.");
      return;
    }
    setShareBusy(true);
    setError("");
    try {
      const outer = await buildSharePayload(
        shareCode,
        previewUrl!,
        selected.title,
        selected.note,
      );
      const res = await fetch("/api/safe-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ciphertext: outer, hours: 72 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      const link = `${window.location.origin}/?recibir=${data.shareId}`;
      setShareLink(link);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo compartir. ¿Nube activa?");
    } finally {
      setShareBusy(false);
    }
  }

  async function receiveShare() {
    setError("");
    if (!validatePinFormat(recvCode) || !recvId.trim()) {
      setError("Pon el enlace/código y 4 números.");
      return;
    }
    try {
      const res = await fetch(`/api/safe-share?id=${encodeURIComponent(recvId.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      const opened = await openSharePayload(recvCode, data.ciphertext);
      setRecvPreview(opened.imageDataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Código o enlace incorrecto.");
    }
  }

  async function saveReceived() {
    const sessionPin = getSessionPin();
    if (!sessionPin || !recvPreview) return;
    const cipherImage = await encryptImageForSafe(sessionPin, recvPreview);
    await saveSafePhoto({
      id: newId(),
      title: "Recibida con código",
      note: "",
      cipherImage,
      createdAt: new Date().toISOString(),
    });
    setRecvPreview(null);
    setRecvCode("");
    setMode("open");
    await refresh();
  }

  if (mode === "setup") {
    return (
      <div className="safe-panel rounded-3xl border border-zinc-700 bg-gradient-to-b from-zinc-800 to-zinc-950 p-5 text-center text-white shadow-xl">
        <SafeIllustration className="mx-auto h-40 w-36" />
        <h2 className="mt-2 text-xl font-bold text-amber-400">Crear tu caja fuerte</h2>
        <p className="mt-1 text-sm text-zinc-400">
          {setupStep === "enter" ? "Elige un código de 4 números" : "Repítelo para confirmar"}
        </p>
        <div className="mt-6 flex justify-center">
          <PinPad
            value={setupStep === "enter" ? pin : confirmPin}
            onChange={setupStep === "enter" ? setPin : setConfirmPin}
          />
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <button
          type="button"
          onClick={() => {
            if (setupStep === "enter" && validatePinFormat(pin)) {
              setSetupStep("confirm");
              setConfirmPin("");
            } else if (setupStep === "confirm") {
              onSetupComplete();
            }
          }}
          className="mt-6 w-full rounded-2xl bg-amber-500 py-3 font-semibold text-zinc-900"
        >
          {setupStep === "enter" ? "Siguiente" : "Guardar código"}
        </button>
      </div>
    );
  }

  if (mode === "unlock") {
    return (
      <div className="safe-panel rounded-3xl border border-zinc-700 bg-gradient-to-b from-zinc-800 to-zinc-950 p-5 text-center text-white shadow-xl">
        <SafeIllustration className="mx-auto h-44 w-40" />
        <h2 className="mt-2 text-xl font-bold text-amber-400">Caja fuerte</h2>
        <p className="mt-1 text-sm text-zinc-400">Introduce tu código de 4 números</p>
        <div className="mt-6 flex justify-center">
          <PinPad value={pin} onChange={setPin} />
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <button
          type="button"
          onClick={onUnlock}
          disabled={pin.length !== 4}
          className="mt-6 w-full rounded-2xl bg-amber-500 py-3 font-semibold text-zinc-900 disabled:opacity-50"
        >
          Abrir
        </button>
        <button
          type="button"
          onClick={() => setMode("receive")}
          className="mt-3 text-sm text-amber-200/80 underline"
        >
          Recibir foto con código
        </button>
      </div>
    );
  }

  if (mode === "add") {
    return (
      <div className="space-y-4 rounded-3xl border border-zinc-700 bg-zinc-900 p-4 text-white">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-amber-400">Nueva foto reservada</h2>
          <button type="button" onClick={() => setMode("open")}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <PhotoCapture label="Foto privada *" previewUrl={addImage} onCapture={setAddImage} onClear={() => setAddImage(undefined)} />
        <input
          className="w-full rounded-xl bg-zinc-800 px-4 py-3"
          placeholder="Título"
          value={addTitle}
          onChange={(e) => setAddTitle(e.target.value)}
        />
        <textarea
          className="w-full rounded-xl bg-zinc-800 px-4 py-3"
          placeholder="Nota (opcional)"
          rows={2}
          value={addNote}
          onChange={(e) => setAddNote(e.target.value)}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="button"
          onClick={saveNewPhoto}
          disabled={!addImage}
          className="w-full rounded-2xl bg-amber-500 py-3 font-semibold text-zinc-900 disabled:opacity-50"
        >
          Guardar en caja fuerte
        </button>
      </div>
    );
  }

  if (mode === "share" && selected) {
    return (
      <div className="space-y-4 rounded-3xl border border-zinc-700 bg-zinc-900 p-4 text-white">
        <h2 className="font-bold text-amber-400">Compartir con código</h2>
        <p className="text-sm text-zinc-400">
          Elige 4 números que le dirás solo a esa persona. Sin el código nadie puede ver la foto.
        </p>
        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" className="max-h-40 w-full rounded-xl object-cover" />
        )}
        <PinPad value={shareCode} onChange={setShareCode} />
        {shareLink ? (
          <div className="rounded-xl bg-zinc-800 p-3 text-sm">
            <p className="text-amber-300">Enlace (72 h):</p>
            <p className="mt-1 break-all text-xs">{shareLink}</p>
            <p className="mt-2 text-zinc-400">Dile también el código de 4 números por teléfono o WhatsApp.</p>
          </div>
        ) : (
          <button
            type="button"
            disabled={shareBusy || shareCode.length !== 4}
            onClick={publishShare}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3 font-semibold text-zinc-900 disabled:opacity-50"
          >
            <Share2 className="h-5 w-5" />
            {shareBusy ? "Creando enlace…" : "Generar enlace seguro"}
          </button>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="button" onClick={() => { setMode("open"); setShareLink(""); setShareCode(""); }} className="w-full py-2 text-sm underline">
          Volver
        </button>
      </div>
    );
  }

  if (mode === "receive") {
    return (
      <div className="space-y-4 rounded-3xl border border-zinc-700 bg-zinc-900 p-4 text-white">
        <SafeIllustration className="mx-auto h-28 w-24 opacity-90" />
        <h2 className="text-center font-bold text-amber-400">Recibir con código</h2>
        <input
          className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-sm"
          placeholder="Código del enlace (ej. abc123…)"
          value={recvId}
          onChange={(e) => setRecvId(e.target.value)}
        />
        <p className="text-center text-xs text-zinc-500">Código secreto de 4 números</p>
        <div className="flex justify-center">
          <PinPad value={recvCode} onChange={setRecvCode} />
        </div>
        {recvPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={recvPreview} alt="Recibida" className="w-full rounded-xl" />
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {!recvPreview ? (
          <button
            type="button"
            onClick={receiveShare}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3 font-semibold text-zinc-900"
          >
            <Download className="h-5 w-5" />
            Descifrar foto
          </button>
        ) : (
          <button type="button" onClick={saveReceived} className="w-full rounded-2xl bg-violet-600 py-3 font-semibold">
            Guardar en mi caja fuerte
          </button>
        )}
        <button type="button" onClick={() => setMode(isSafeUnlocked() ? "open" : "unlock")} className="w-full py-2 text-sm underline">
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="safe-panel flex items-center justify-between rounded-2xl border border-zinc-700 bg-gradient-to-r from-zinc-800 to-zinc-900 p-3 text-white">
        <div className="flex items-center gap-2">
          <SafeIllustration className="h-14 w-12" />
          <div>
            <p className="font-bold text-amber-400">Caja fuerte</p>
            <p className="text-xs text-zinc-400">{photos.length} foto(s) reservada(s)</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            lockSafe();
            setMode("unlock");
            setPin("");
          }}
          className="rounded-xl bg-zinc-700 p-2"
          aria-label="Bloquear"
        >
          <Lock className="h-5 w-5 text-amber-400" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setMode("add")}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-500/50 bg-zinc-900/80 py-8 text-amber-400"
        >
          <Plus className="h-8 w-8" />
          <span className="text-sm font-medium">Añadir foto</span>
        </button>
        {photos.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => openPhoto(p)}
            className="overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 text-left"
          >
            {previews[p.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previews[p.id]} alt={p.title} className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square items-center justify-center text-zinc-500">🔒</div>
            )}
            <p className="truncate px-2 py-1 text-xs text-amber-200">{p.title}</p>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setMode("receive")}
        className="w-full rounded-xl border border-zinc-600 py-3 text-sm text-zinc-300"
      >
        Recibir foto con código
      </button>

      {selected && previewUrl && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-black/90 p-4">
          <button type="button" className="self-end text-white" onClick={() => { setSelected(null); setPreviewUrl(null); }}>
            <X className="h-8 w-8" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt={selected.title} className="mx-auto max-h-[60vh] rounded-xl object-contain" />
          <p className="mt-4 text-center text-lg font-semibold text-amber-400">{selected.title}</p>
          {selected.note && <p className="text-center text-sm text-zinc-300">{selected.note}</p>}
          <div className="mt-auto flex flex-col gap-2 pb-8">
            <button
              type="button"
              onClick={() => setMode("share")}
              className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 py-3 font-semibold text-zinc-900"
            >
              <Share2 className="h-5 w-5" />
              Compartir con código de 4 números
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!confirm("¿Eliminar esta foto de la caja fuerte?")) return;
                await deleteSafePhoto(selected.id);
                setSelected(null);
                setPreviewUrl(null);
                await refresh();
              }}
              className="rounded-2xl border border-red-500 py-3 text-red-400"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
