"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Mail, Sparkles } from "lucide-react";
import { z } from "zod";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { AuthShell, GoogleIcon } from "@/components/auth/auth-shell";
import { AuthDivider, AuthError, AuthField } from "@/components/auth/auth-form";

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
    defaultValues: { email: "rina@email.com", password: "rina12345" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (!result || result.error) {
      setServerError("Email atau password salah. Coba lagi, ya.");
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
    <AuthShell side="right">
      <div className="space-y-5">
        <header className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--coral)_22%,transparent)] bg-[color-mix(in_oklch,var(--coral)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--coral)]">
            <Sparkles size={10} strokeWidth={2.5} />
            Masuk
          </span>
          <h1 className="font-heading text-[26px] font-bold leading-tight tracking-tight">
            Hai, welcome back <span className="inline-block">👋</span>
          </h1>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Masuk lanjutin perjalanan belajar kamu bareng Spark.
          </p>
        </header>

        {justRegistered && (
          <output className="flex items-start gap-2 rounded-2xl border border-[var(--teal)]/30 bg-[color-mix(in_oklch,var(--teal)_10%,transparent)] px-3.5 py-2.5 text-[12.5px] font-medium text-[var(--teal)]">
            <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-[var(--teal)]" />
            Akun kamu sudah dibuat — silakan masuk.
          </output>
        )}

        <Button
          type="button"
          variant="outline"
          size="xl"
          disabled={googleLoading || isSubmitting}
          onClick={handleGoogle}
          className="w-full rounded-2xl border-border/60 bg-background/70 text-[14px] font-semibold shadow-[0_2px_8px_rgba(80,20,50,0.04)] hover:bg-background"
        >
          {googleLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          Lanjut dengan Google
        </Button>

        <AuthDivider label="atau masuk dengan email" />

        <form onSubmit={onSubmit} className="space-y-3.5" noValidate>
          <AuthField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="kamu@email.com"
            layout="horizontal"
            error={errors.email?.message}
            rightSlot={
              <span className="grid size-8 place-items-center text-muted-foreground">
                <Mail size={15} />
              </span>
            }
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
            rightSlot={
              <Link
                href="/auth/forgot-password"
                tabIndex={-1}
                className="hidden text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground sm:block"
              >
                Lupa?
              </Link>
            }
            {...register("password")}
          />

          <div className="-mt-1 flex justify-end sm:hidden">
            <Link
              href="/auth/forgot-password"
              className="text-[11.5px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Lupa password?
            </Link>
          </div>

          <AuthError message={serverError ?? undefined} />

          <Button
            type="submit"
            size="xl"
            disabled={isSubmitting || googleLoading}
            className="w-full rounded-2xl bg-[var(--coral)] text-[14px] font-bold text-white shadow-[0_8px_24px_rgba(225,29,72,0.35)] hover:bg-[var(--coral)]/90 hover:shadow-[0_12px_32px_rgba(225,29,72,0.5)]"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : null}
            {isSubmitting ? "Masuk..." : "Masuk"}
          </Button>
        </form>

        <p className="text-center text-[13px] text-muted-foreground">
          Belum punya akun?{" "}
          <Link
            href="/auth/register"
            className="font-bold text-[var(--coral)] underline-offset-4 hover:underline"
          >
            Daftar gratis
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
