"use client";

import { useState } from "react";
import { Camera, KeyRound, MapPin, Mic, Notebook, Calendar } from "lucide-react";
import type { MemoryKind, MemoryRecord } from "@/types/memory";
import { encryptSecret, isVaultUnlocked } from "@/lib/vault";
import { newId } from "@/lib/id";
import { saveMemory } from "@/lib/db";

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
  const [meetingAt, setMeetingAt] = useState("");
  const [secret, setSecret] = useState("");
  const [mediaDataUrl, setMediaDataUrl] = useState<string | undefined>();
  const [recording, setRecording] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function captureLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocationLabel(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      },
      () => setError("No pude obtener la ubicación. Escribe el lugar a mano."),
    );
  }

  function onPhotoChange(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setMediaDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function toggleRecording() {
    if (recording && recorder) {
      recorder.stop();
      setRecording(false);
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];
    mr.ondataavailable = (e) => chunks.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const reader = new FileReader();
      reader.onload = () => setMediaDataUrl(reader.result as string);
      reader.readAsDataURL(blob);
      stream.getTracks().forEach((t) => t.stop());
    };
    mr.start();
    setRecorder(mr);
    setRecording(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Pon al menos un título para encontrarlo después.");
      return;
    }

    if (kind === "password") {
      if (!isVaultUnlocked()) {
        setError("Desbloquea la bóveda en Ajustes antes de guardar claves.");
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
      meetingAt: kind === "meeting" && meetingAt ? new Date(meetingAt).toISOString() : undefined,
      createdAt: now,
      updatedAt: now,
    };

    if (kind === "password" && secret) {
      record.secretCipher = await encryptSecret(secret);
      record.body = body.trim() || record.body;
    }

    await saveMemory(record);
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl dark:bg-zinc-900"
      >
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Guardar recuerdo</h2>
        <p className="mt-1 text-sm text-zinc-500">Elige el tipo y describe lo justo para recordarlo.</p>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {KINDS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setKind(id)}
              className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-xs ${
                kind === id
                  ? "border-violet-500 bg-violet-50 text-violet-800 dark:bg-violet-950 dark:text-violet-100"
                  : "border-zinc-200 dark:border-zinc-700"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-sm font-medium">Título *</label>
        <input
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          placeholder="Ej. Llaves del coche, WiFi casa, Dentista…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {(kind === "object" || kind === "photo" || kind === "note") && (
          <>
            <label className="mt-3 block text-sm font-medium">Detalle</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
              rows={3}
              placeholder="Ej. En el cajón azul de la entrada"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </>
        )}

        {(kind === "object" || kind === "photo") && (
          <>
            <label className="mt-3 block text-sm font-medium">¿Dónde?</label>
            <div className="mt-1 flex gap-2">
              <input
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
                placeholder="Ej. Cocina, bolso marron…"
                value={locationLabel}
                onChange={(e) => setLocationLabel(e.target.value)}
              />
              <button
                type="button"
                onClick={captureLocation}
                className="rounded-lg bg-zinc-100 px-3 text-sm dark:bg-zinc-800"
              >
                GPS
              </button>
            </div>
            {kind === "photo" && (
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="mt-2 w-full text-sm"
                onChange={(e) => onPhotoChange(e.target.files?.[0] ?? null)}
              />
            )}
          </>
        )}

        {kind === "password" && (
          <>
            <label className="mt-3 block text-sm font-medium">Contraseña</label>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
            <label className="mt-3 block text-sm font-medium">Nota (usuario, web…)</label>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </>
        )}

        {kind === "meeting" && (
          <>
            <label className="mt-3 block text-sm font-medium">Fecha y hora</label>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
              value={meetingAt}
              onChange={(e) => setMeetingAt(e.target.value)}
              required
            />
            <label className="mt-3 block text-sm font-medium">Notas</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
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
              className={`mt-3 w-full rounded-xl py-3 font-medium ${
                recording ? "bg-red-500 text-white" : "bg-violet-600 text-white"
              }`}
            >
              {recording ? "Detener grabación" : "Grabar nota de voz"}
            </button>
            <label className="mt-3 block text-sm font-medium">Transcripción (opcional)</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
              rows={2}
              placeholder="Escribe o dicta lo que dijiste"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </>
        )}

        <label className="mt-3 block text-sm font-medium">Etiquetas (separadas por coma)</label>
        <input
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          placeholder="casa, urgente, trabajo"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-zinc-300 py-2.5 dark:border-zinc-600"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-xl bg-violet-600 py-2.5 font-medium text-white disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
