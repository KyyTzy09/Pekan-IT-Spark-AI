import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf5f0" },
    { media: "(prefers-color-scheme: dark)", color: "#141726" },
  ],
};

export const metadata: Metadata = {
  title: "Spark Ai — Tutor Pintar yang Ngertiin Kamu",
  description:
    "Asisten tutor AI adaptif untuk siswa SMA/SMK. Penjelasan yang pas di level kamu, latihan adaptif, dan upload materi dari guru.",
  icons: {
    icon: "/icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Spark AI",
  },
  formatDetection: {
    telephone: false,
    email: false,
  },
  robots: {
    index: true,
    follow: true,
  },
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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-[var(--coral)] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg"
        >
          Langsung ke konten
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
