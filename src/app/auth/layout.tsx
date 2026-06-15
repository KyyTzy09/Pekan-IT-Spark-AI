import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk atau Daftar — Spark Ai",
  description:
    "Akses akun Spark Ai kamu atau buat akun baru gratis. Mulai belajar dengan tutor AI yang sabar dan adaptif.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
