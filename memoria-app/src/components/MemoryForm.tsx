"use client";

import { useRef, useState } from "react";
import { KeyRound, MapPin, Mic, Notebook, Calendar, Camera } from "lucide-react";
import type { MemoryKind, MemoryRecord } from "@/types/memory";
import { encryptSecret, isVaultUnlocked } from "@/lib/vault";
import { newId } from "@/lib/id";
import { saveMemory } from "@/lib/db";
import { PhotoCapture } from "@/components/PhotoCapture";
import { pickAudioMimeType } from "@/lib/media";

const KINDS: { id: MemoryKind; label: string; icon: typeof KeyRound }[] = [
  { id: "object", label: "Objeto / llaves", icon: MapPin },
  { id: "photo", label: "Foto del lugar", icon: Camera },
  { id: "password", label: "Clave", icon: KeyRound },
  { id: "meeting", label: "Reunión", icon: Calendar },
  { id: "voice", label: "Nota de voz", icon: Mic },
  { id: "note", label: "Nota rápida", icon: Notebook },
];

interface Props {
  onSaved: () => void;
  onClose: () => void;
}

export function MemoryForm({ onSaved, onClose }: Props) {
  const [kind, setKind] = useState<MemoryKind>("object");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [meetingAt, setMeetingAt] = useState("");
  const [secret, setSecret] = useState("");
  const [mediaDataUrl, setMediaDataUrl] = useState<string | undefined>();
  const [recording, setRecording] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  async function captureLocation() {
    if (!navigator.geolocation) {
      setError("Tu navegador no tiene GPS. Escribe el lugar a mano.");
      return;
    }
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLatitude(lat);
        setLongitude(lng);
        setLocationLabel((prev) => prev.trim() || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      },
      () => setError("No pude obtener la ubicación. Escribe el lugar a mano."),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function toggleRecording() {
    if (recording && recorderRef.current) {
      recorderRef.current.stop();
      setRecording(false);
      return;
    }

    setError("");
    setAudioReady(false);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickAudioMimeType();
      const mr = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        stopStream();
        const blob = new Blob(chunksRef.current, {
          type: mr.mimeType || "audio/webm",
        });
        if (blob.size < 100) {
          setError("La grabación quedó vacía. Intenta de nuevo.");
          setAudioReady(false);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          setMediaDataUrl(reader.result as string);
          setAudioReady(true);
        };
        reader.readAsDataURL(blob);
        recorderRef.current = null;
      };

      mr.onerror = () => {
        setError("Error al grabar. Comprueba el permiso del micrófono.");
        setRecording(false);
        stopStream();
      };

      recorderRef.current = mr;
      mr.start(250);
      setRecording(true);
    } catch {
      setError("Permite el micrófono en Ajustes del navegador e intenta otra vez.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (recording) {
      setError("Detén la grabación antes de guardar.");
      return;
    }

    if (!title.trim()) {
      setError("Pon al menos un título para encontrarlo después.");
      return;
    }

    if (kind === "voice" && !mediaDataUrl) {
      setError("Graba una nota de voz antes de guardar (botón rojo → Detener).");
      return;
    }

    if (kind === "photo" && !mediaDataUrl) {
      setError("Toma o elige una foto antes de guardar.");
      return;
    }

    if (kind === "password") {
      if (!isVaultUnlocked()) {
        setError("Desbloquea la bóveda en Cuenta antes de guardar claves.");
        return;
      }
      if (!secret.trim()) {
        setError("Escribe la contraseña a guardar.");
        return;
      }
    }

    setSaving(true);
    const now = new Date().toISOString();
    const record: MemoryRecord = {
      id: newId(),
      kind,
      title: title.trim(),
      body: body.trim(),
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      mediaDataUrl,
      locationLabel: locationLabel.trim() || undefined,
      latitude,
      longitude,
      meetingAt: kind === "meeting" && meetingAt ? new Date(meetingAt).toISOString() : undefined,
      createdAt: now,
      updatedAt: now,
    };

    if (kind === "password" && secret) {
      record.secretCipher = await encryptSecret(secret);
    }

    try {
      await saveMemory(record);
      onSaved();
      onClose();
    } catch {
      setError("No se pudo guardar (quizá la foto es muy grande). Prueba otra imagen.");
    } finally {
      setSaving(false);
    }
  }

  const showPhoto = kind === "photo" || kind === "object";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="memoria-sheet max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-violet-100 bg-white p-5 shadow-2xl dark:border-violet-900 dark:bg-zinc-900"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-600" />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Guardar recuerdo</h2>
        <p className="mt-1 text-sm text-zinc-500">Toca un tipo y completa lo mínimo.</p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {KINDS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setKind(id)}
              className={`flex flex-col items-center gap-1 rounded-2xl border p-2.5 text-[11px] font-medium transition ${
                kind === id
                  ? "border-violet-500 bg-gradient-to-br from-violet-100 to-indigo-50 text-violet-900 shadow-sm dark:from-violet-950 dark:to-indigo-950 dark:text-violet-100"
                  : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-sm font-semibold">Título *</label>
        <input
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-800"
          placeholder="Ej. Llaves, pasaporte, WiFi…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {(kind === "object" || kind === "photo" || kind === "note") && (
          <>
            <label className="mt-3 block text-sm font-semibold">Detalle</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-800"
              rows={3}
              placeholder="Ej. En el cajón azul de la entrada"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </>
        )}

        {(kind === "object" || kind === "photo") && (
          <>
            <label className="mt-3 block text-sm font-semibold">¿Dónde?</label>
            <div className="mt-1 flex gap-2">
              <input
                className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-800"
                placeholder="Ej. Cocina, bolso marrón…"
                value={locationLabel}
                onChange={(e) => setLocationLabel(e.target.value)}
              />
              <button
                type="button"
                onClick={captureLocation}
                className="rounded-xl bg-violet-100 px-4 text-sm font-semibold text-violet-800 dark:bg-violet-900 dark:text-violet-100"
              >
                GPS
              </button>
            </div>
          </>
        )}

        {showPhoto && (
          <PhotoCapture
            label={kind === "photo" ? "Foto del lugar *" : "Foto (opcional)"}
            previewUrl={mediaDataUrl}
            onCapture={setMediaDataUrl}
            onClear={() => setMediaDataUrl(undefined)}
          />
        )}

        {kind === "password" && (
          <>
            <label className="mt-3 block text-sm font-semibold">Contraseña</label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-800"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
            <label className="mt-3 block text-sm font-semibold">Nota (usuario, web…)</label>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-800"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </>
        )}

        {kind === "meeting" && (
          <>
            <label className="mt-3 block text-sm font-semibold">Fecha y hora</label>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-800"
              value={meetingAt}
              onChange={(e) => setMeetingAt(e.target.value)}
              required
            />
            <label className="mt-3 block text-sm font-semibold">Notas</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-800"
              rows={2}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </>
        )}

        {kind === "voice" && (
          <>
            <button
              type="button"
              onClick={toggleRecording}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-semibold text-white shadow-lg ${
                recording ? "animate-pulse bg-red-500" : "bg-gradient-to-r from-violet-600 to-indigo-600"
              }`}
            >
              <Mic className="h-6 w-6" />
              {recording ? "Detener grabación" : "Grabar nota de voz"}
            </button>
            {audioReady && mediaDataUrl && (
              <div className="mt-3 rounded-2xl bg-emerald-50 p-3 dark:bg-emerald-950/40">
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">✓ Audio listo</p>
                <audio controls className="mt-2 w-full" src={mediaDataUrl} preload="metadata">
                  <track kind="captions" />
                </audio>
              </div>
            )}
            <label className="mt-3 block text-sm font-semibold">Transcripción (opcional)</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-800"
              rows={2}
              placeholder="Resume con palabras lo que dijiste"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </>
        )}

        <label className="mt-3 block text-sm font-semibold">Etiquetas (coma)</label>
        <input
          className="mt-1 w-full rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-800"
          placeholder="casa, urgente"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />

        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-200">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-2 pb-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-zinc-300 py-3.5 font-medium dark:border-zinc-600"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || recording}
            className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
