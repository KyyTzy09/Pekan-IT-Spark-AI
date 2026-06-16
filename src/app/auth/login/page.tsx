"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  AuthDivider,
  AuthError,
  AuthField,
  GoogleIcon,
} from "@/components/auth/auth-form";
import { Button } from "@/components/ui/button";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  return (
    <React.Suspense fallback={null}>
      <LoginForm />
    </React.Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl") || "/dashboard";
  const justRegistered = search.get("registered") === "1";

  const [serverError, setServerError] = React.useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (!result || result.error) {
      setServerError("Email atau password salah. Coba dicek kembali ya.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  });

  const handleGoogle = async () => {
    setServerError(null);
    setGoogleLoading(true);
    await signIn("google", { callbackUrl });
  };

  return (
    <div className="space-y-6">
      {/* ── Greeting with streak teaser ── */}
      <header className="space-y-2">
        <h1 className="font-heading text-[28px] font-extrabold leading-[1.1] tracking-tight text-foreground anim-slide-up gpu">
          Masuk ke <span className="text-gradient-warm">Spark</span>
        </h1>
        <p
          className="text-[13.5px] leading-relaxed text-muted-foreground anim-slide-up gpu"
          style={{ animationDelay: "80ms" }}
        >
          Streak dan progress kamu masih tersimpan — yuk lanjut! 🔥
        </p>
      </header>

      {/* ── Success banner ── */}
      {justRegistered && (
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--teal)]/20 bg-[color-mix(in_oklch,var(--teal)_6%,transparent)] px-4 py-3 animate-fade-in">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--teal)]/12">
            <span className="text-[var(--teal)] text-[14px]">✓</span>
          </span>
          <span className="text-[12.5px] font-semibold text-[var(--teal)]">
            Akun berhasil dibuat! Silakan masuk.
          </span>
        </div>
      )}

      {/* ── Google ── */}
      <div className="anim-slide-up gpu" style={{ animationDelay: "140ms" }}>
        <Button
          type="button"
          variant="outline"
          size="xl"
          disabled={googleLoading || isSubmitting}
          onClick={handleGoogle}
          className="group w-full flex items-center justify-center gap-2.5 rounded-2xl border-border/50 bg-card/40 text-[13.5px] font-bold shadow-sm hover:bg-card hover:shadow-md hover:border-border/80 transition-all cursor-pointer active:scale-[0.98]"
        >
          {googleLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          Lanjut dengan Google
        </Button>
      </div>

      <div className="anim-slide-up gpu" style={{ animationDelay: "180ms" }}>
        <AuthDivider label="atau pakai email" />
      </div>

      {/* ── Form ── */}
      <form
        onSubmit={onSubmit}
        className="space-y-4 anim-slide-up gpu"
        style={{ animationDelay: "220ms" }}
        noValidate
      >
        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="kamu@email.com"
          layout="horizontal"
          error={errors.email?.message}
          {...register("email")}
        />

        <AuthField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          layout="horizontal"
          error={errors.password?.message}
          {...register("password")}
        />

        <AuthError message={serverError ?? undefined} />

        <Button
          type="submit"
          size="xl"
          disabled={isSubmitting || googleLoading}
          className="group w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--coral)] to-[color-mix(in_oklch,var(--coral)_80%,var(--orange))] text-[14px] font-extrabold text-white shadow-[0_4px_16px_rgba(225,29,72,0.25)] hover:shadow-[0_8px_24px_rgba(225,29,72,0.35)] hover:brightness-105 transition-all duration-300 cursor-pointer active:scale-[0.97]"
        >
          {isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ArrowRight
              size={16}
              strokeWidth={2.5}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          )}
          {isSubmitting ? "Sedang Masuk..." : "Masuk"}
        </Button>
      </form>

      {/* ── Bottom ── */}
      <p
        className="text-center text-[13px] text-muted-foreground anim-slide-up gpu"
        style={{ animationDelay: "280ms" }}
      >
        Belum punya akun?{" "}
        <Link
          href="/auth/register"
          className="font-bold text-[var(--coral)] hover:underline underline-offset-4 transition-all"
        >
          Daftar gratis
        </Link>
      </p>
    </div>
  );
}
