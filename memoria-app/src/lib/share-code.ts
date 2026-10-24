/** Código de 4 dígitos generado por la app (0000–9999) */
export function generateShareCode(): string {
  const n = crypto.getRandomValues(new Uint16Array(1))[0]! % 10_000;
  return n.toString().padStart(4, "0");
}
