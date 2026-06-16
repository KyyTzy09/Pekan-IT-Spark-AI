import type { Metadata } from "next";
import { Fredoka, Geist, Geist_Mono, Nunito } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  preload: true,
  adjustFontFallback: true,
  fallback: ["system-ui", "sans-serif"],
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  preload: true,
  adjustFontFallback: true,
  fallback: ["system-ui", "sans-serif"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  fallback: ["system-ui", "sans-serif"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false, // mono rarely used on first paint
  adjustFontFallback: true,
  fallback: ["ui-monospace", "monospace"],
});

export const metadata: Metadata = {
  title: "Spark Ai — Tutor Pintar yang Ngertiin Kamu",
  description:
    "Asisten tutor AI adaptif untuk siswa SMA/SMK. Penjelasan yang pas di level kamu, latihan adaptif, dan upload materi dari guru.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased",
        fredoka.variable,
        nunito.variable,
        geistSans.variable,
        geistMono.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
