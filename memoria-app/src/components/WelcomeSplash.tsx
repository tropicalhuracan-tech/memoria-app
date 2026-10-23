"use client";

import { Brain, Sparkles } from "lucide-react";

interface Props {
  onEnter: () => void;
}

export function WelcomeSplash({ onEnter }: Props) {
  return (
    <div className="memoria-bg fixed inset-0 z-[100] flex flex-col items-center justify-center px-6">
      <div className="welcome-brain relative flex h-40 w-40 items-center justify-center">
        <div className="welcome-ring absolute inset-0 rounded-full" />
        <div className="welcome-ring welcome-ring-delay absolute inset-3 rounded-full" />
        <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 shadow-2xl shadow-violet-500/40">
          <Brain className="welcome-pulse h-14 w-14 text-white" strokeWidth={1.5} />
        </div>
        <Sparkles className="welcome-spark absolute -right-1 top-4 h-6 w-6 text-amber-400" />
        <Sparkles className="welcome-spark welcome-spark-delay absolute -left-2 bottom-6 h-5 w-5 text-violet-300" />
      </div>

      <h1 className="mt-10 text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
        Memoria
      </h1>
      <p className="mt-3 max-w-xs text-center text-base leading-relaxed text-zinc-600 dark:text-violet-200/90">
        Pensando en lo que no quieres olvidar…
      </p>
      <p className="mt-1 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Llaves, citas, fotos y notas de voz
      </p>

      <button
        type="button"
        onClick={onEnter}
        className="memoria-enter-btn mt-12 min-h-[56px] w-full max-w-xs rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-xl shadow-violet-500/30 active:scale-[0.98]"
      >
        Entrar a mis memorias
      </button>

      <p className="mt-6 text-xs text-zinc-400">Toca para continuar</p>
    </div>
  );
}
