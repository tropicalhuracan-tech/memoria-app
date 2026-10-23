"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Send, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { answerMemoryQuestion } from "@/lib/chat-engine";
import { appendChatMessage, getAllMemories, getChatHistory } from "@/lib/db";
import type { ChatMessage } from "@/types/memory";
import { newId } from "@/lib/id";

interface Props {
  vaultReady: boolean;
}

export function ChatPanel({ vaultReady }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    getChatHistory().then(setMessages);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const SR =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "es-ES";
    rec.interimResults = false;
    rec.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0]?.[0]?.transcript ?? "";
      setInput(text);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
  }, []);

  function toggleVoice() {
    const rec = recognitionRef.current;
    if (!rec) {
      alert("Tu navegador no soporta dictado por voz. Escribe la pregunta.");
      return;
    }
    if (listening) {
      rec.stop();
      setListening(false);
    } else {
      setListening(true);
      rec.start();
    }
  }

  async function sendQuestion(text: string) {
    const q = text.trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: newId(),
      role: "user",
      content: q,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    await appendChatMessage(userMsg);
    setInput("");
    setLoading(true);

    const memories = await getAllMemories();
    const reply = await answerMemoryQuestion(q, memories);

    const assistantMsg: ChatMessage = {
      id: newId(),
      role: "assistant",
      content: reply.text,
      createdAt: new Date().toISOString(),
      relatedMemoryIds: reply.relatedIds,
    };
    setMessages((m) => [...m, assistantMsg]);
    await appendChatMessage(assistantMsg);
    setLoading(false);
  }

  const suggestions = [
    "¿Dónde dejé las llaves?",
    "¿Cuál es mi próxima reunión?",
    "¿Qué claves tengo guardadas?",
    "Resume lo que tengo guardado",
  ];

  return (
    <div className="flex h-full min-h-[420px] flex-col rounded-2xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-600" />
          <div>
            <h2 className="font-semibold">Pregúntame</h2>
            <p className="text-xs text-zinc-500">
              Busco en tus recuerdos. Para claves, {vaultReady ? "bóveda desbloqueada." : "desbloquea la bóveda."}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-zinc-500">Ejemplos:</p>
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => sendQuestion(s)}
                className="block w-full rounded-xl bg-violet-50 px-3 py-2 text-left text-sm text-violet-900 dark:bg-violet-950 dark:text-violet-100"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[95%] rounded-2xl px-4 py-2 text-sm ${
              msg.role === "user"
                ? "ml-auto bg-violet-600 text-white"
                : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
            }`}
          >
            {msg.role === "assistant" ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            ) : (
              msg.content
            )}
          </div>
        ))}
        {loading && (
          <p className="text-sm text-zinc-500">Buscando en tu memoria…</p>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="flex gap-2 border-t border-zinc-100 p-3 dark:border-zinc-800"
        onSubmit={(e) => {
          e.preventDefault();
          sendQuestion(input);
        }}
      >
        <button
          type="button"
          onClick={toggleVoice}
          className={`rounded-xl p-3 ${listening ? "bg-red-500 text-white" : "bg-zinc-100 dark:bg-zinc-800"}`}
          aria-label="Dictar pregunta"
        >
          <Mic className="h-5 w-5" />
        </button>
        <input
          className="flex-1 rounded-xl border border-zinc-300 px-3 dark:border-zinc-600 dark:bg-zinc-800"
          placeholder="Ej. ¿Dónde puse el pasaporte?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-xl bg-violet-600 p-3 text-white disabled:opacity-50"
          disabled={loading}
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
