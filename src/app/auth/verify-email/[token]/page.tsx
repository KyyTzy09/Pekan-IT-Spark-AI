"use client";

import { CheckCircle2, Mail, Sparkles, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";

import {
  AuthDivider,
  AuthError,
  GoogleIcon,
} from "@/components/auth/auth-form";

type State = "loading" | "success" | "invalid";

export default function VerifyEmailPage() {
  const params = useParams<{ token: string }>();
  const [state, setState] = React.useState<State>("loading");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setState(params?.token ? "success" : "invalid");
    }, 800);
    return () => clearTimeout(timer);
  }, [params?.token]);

  return (
    <div className="space-y-7">
      {state === "loading" && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--coral)] to-[var(--orange)] text-white shadow-md animate-pulse">
            <Mail size={20} strokeWidth={2.2} />
          </div>
          <div className="space-y-2.5">
            <h1 className="font-heading text-[26px] font-extrabold leading-tight tracking-tight text-foreground">
              Memverifikasi email...
            </h1>
            <p className="max-w-[340px] text-[13.5px] leading-relaxed text-muted-foreground">
              Mohon tunggu sebentar ya, kami sedang memeriksa token verifikasi
              email kamu.
            </p>
          </div>
        </div>
      )}

      {state === "success" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--teal)] to-[var(--green)] text-white shadow-md">
            <CheckCircle2 size={20} strokeWidth={2.2} />
          </div>
          <div className="space-y-2.5">
            <h1 className="font-heading text-[26px] font-extrabold leading-tight tracking-tight text-foreground">
              Email terverifikasi! 🎉
            </h1>
            <p className="max-w-[340px] text-[13.5px] leading-relaxed text-muted-foreground">
              Akun kamu sudah terverifikasi penuh dan siap digunakan untuk
              belajar bareng Spark.
            </p>
          </div>
          <Link
            href="/auth/login?verified=1"
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--coral)] to-[color-mix(in_oklch,var(--coral)_85%,var(--orange))] px-6 text-[13.5px] font-extrabold text-white shadow-[0_6px_20px_rgba(225,29,72,0.30)] hover:shadow-[0_10px_28px_rgba(225,29,72,0.40)] hover:brightness-110 transition-all duration-300 cursor-pointer active:scale-[0.97]"
          >
            <Sparkles size={14} />
            Masuk Sekarang
          </Link>
        </div>
      )}

      {state === "invalid" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-destructive to-[var(--pink)] text-white shadow-md">
            <XCircle size={20} strokeWidth={2.2} />
          </div>
          <div className="space-y-3">
            <h1 className="font-heading text-[26px] font-extrabold leading-tight tracking-tight text-foreground">
              Token tidak valid
            </h1>
            <AuthError message="Token verifikasi email salah, tidak valid, atau sudah kedaluwarsa." />
          </div>
          <Link
            href="/auth/login"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card/50 px-6 text-[13.5px] font-bold text-foreground hover:bg-card/90 hover:border-border transition-all cursor-pointer active:scale-[0.97]"
          >
            Balik ke halaman masuk
          </Link>
        </div>
      )}

      <AuthDivider label="atau" />
      <div
        className="flex items-center gap-2.5 text-[11.5px] font-medium text-muted-foreground anim-slide-up gpu"
        style={{ animationDelay: "200ms" }}
      >
        <GoogleIcon />
        <span>Login via Google otomatis terverifikasi langsung.</span>
      </div>
    </div>
  );
}
