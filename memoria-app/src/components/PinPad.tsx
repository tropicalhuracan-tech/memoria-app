"use client";

import { Delete } from "lucide-react";

interface Props {
  value: string;
  onChange: (pin: string) => void;
  maxLength?: number;
  disabled?: boolean;
}

export function PinPad({ value, onChange, maxLength = 4, disabled }: Props) {
  function press(digit: string) {
    if (disabled || value.length >= maxLength) return;
    onChange(value + digit);
  }

  function backspace() {
    if (disabled) return;
    onChange(value.slice(0, -1));
  }

  return (
    <div className="w-full max-w-xs">
      <div className="mb-6 flex justify-center gap-3">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-full border-2 transition ${
              i < value.length
                ? "border-amber-400 bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                : "border-zinc-400 bg-transparent dark:border-zinc-600"
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            type="button"
            disabled={disabled}
            onClick={() => press(d)}
            className="flex h-14 items-center justify-center rounded-2xl bg-zinc-800 text-xl font-semibold text-amber-50 shadow-inner active:scale-95 disabled:opacity-40 dark:bg-zinc-950"
          >
            {d}
          </button>
        ))}
        <div />
        <button
          type="button"
          disabled={disabled}
          onClick={() => press("0")}
          className="flex h-14 items-center justify-center rounded-2xl bg-zinc-800 text-xl font-semibold text-amber-50 active:scale-95 disabled:opacity-40 dark:bg-zinc-950"
        >
          0
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={backspace}
          className="flex h-14 items-center justify-center rounded-2xl bg-zinc-700 text-amber-100 active:scale-95 disabled:opacity-40"
          aria-label="Borrar"
        >
          <Delete className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
