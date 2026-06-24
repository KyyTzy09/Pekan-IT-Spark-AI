"use client";

import { CheckCircle2, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import * as React from "react";

// UX-5 FIX: Email verification is not yet implemented. Show honest message
// instead of faking verification success.
export default function VerifyEmailPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--teal)] to-[var(--green)] text-white shadow-md">
        <CheckCircle2 size={20} strokeWidth={2.2} />
      </div>
      <div className="space-y-2.5">
        <h1 className="font-heading text-[26px] font-extrabold leading-tight tracking-tight text-foreground">
          Akun siap digunakan! 🎉
        </h1>
        <p className="max-w-[340px] text-[13.5px] leading-relaxed text-muted-foreground">
          Kamu bisa langsung masuk dan mulai belajar bareng Spark. Verifikasi email akan tersedia di update mendatang.
        </p>
      </div>
      <Link
        href="/auth/login"
        className="group inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--coral)] to-[color-mix(in_oklch,var(--coral)_85%,var(--orange))] px-6 text-[13.5px] font-extrabold text-white shadow-[0_6px_20px_rgba(225,29,72,0.30)] hover:shadow-[0_10px_28px_rgba(225,29,72,0.40)] hover:brightness-110 transition-all duration-300 cursor-pointer active:scale-[0.97]"
      >
        <Sparkles size={14} />
        Masuk Sekarang
      </Link>
    </div>
  );
}
