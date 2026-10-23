import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Memoria — tu segundo cerebro",
  description:
    "Guarda dónde dejaste las llaves, claves, reuniones, fotos y notas de voz. Pregunta por chat o voz.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Memoria",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-gradient-to-b from-violet-50 to-white dark:from-zinc-950 dark:to-zinc-900">
        {children}
      </body>
    </html>
  );
}
