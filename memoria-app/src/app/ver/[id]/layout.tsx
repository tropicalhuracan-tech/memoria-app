import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Foto protegida — Memoria",
  description: "Introduce el código de 4 números para ver la imagen.",
  robots: { index: false, follow: false },
};

export default function VerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
