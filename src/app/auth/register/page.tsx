"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Rocket } from "lucide-react";
import Link from "next/link";
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
import {
  AuthRoleSelector,
  type AuthRole,
} from "@/components/auth/auth-role-selector";
import { AuthTrustBadges } from "@/components/auth/auth-trust-badges";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import { sanitizeInternalPath } from "@/lib/auth-utils";
import { type AuthActionState, registerAction } from "@/server/actions/auth";

const studentSchema = z.object({
  role: z.literal("STUDENT"),
  name: z.string().min(2, "Nama minimal 2 karakter").max(60),
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(72, "Password maksimal 72 karakter"),
});

const parentSchema = z.object({
  role: z.literal("PARENT"),
  name: z.string().min(2, "Nama minimal 2 karakter").max(60),
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(72, "Password maksimal 72 karakter"),
  inviteCode: z
    .string()
    .min(4, "Kode undangan minimal 4 karakter")
    .max(32, "Kode undangan maksimal 32 karakter"),
});

const registerSchema = z.discriminatedUnion("role", [
  studentSchema,
  parentSchema,
]);

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {},
  );
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [role, setRole] = React.useState<AuthRole>("STUDENT");
  const [password, setPassword] = React.useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "STUDENT",
      name: "",
      email: "",
      password: "",
    } as unknown as RegisterValues,
  });

  const handleRoleChange = (next: AuthRole) => {
    setRole(next);
    setServerError(null);
    setFieldErrors({});
    setValue("role" as never, next as never, { shouldValidate: false });
  };

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setFieldErrors({});

    if (values.role === "PARENT" && !values.inviteCode) {
      setServerError(
        "Minta kode undangan ke anak kamu dulu, ya. Kode bisa dibuat di halaman profil siswa nanti.",
      );
      return;
    }

    const fd = new FormData();
    fd.set("role", values.role);
    fd.set("name", values.name);
    fd.set("email", values.email);
    fd.set("password", values.password);
    if (values.role === "PARENT" && values.inviteCode) {
      fd.set("inviteCode", values.inviteCode);
    }

    let result: AuthActionState | undefined;
    try {
      result = await registerAction(undefined, fd);
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "digest" in error &&
        typeof (error as { digest?: unknown }).digest === "string" &&
        (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
      ) {
        throw error;
      }
      setServerError("Terjadi kesalahan. Coba lagi, ya.");
      return;
    }

    if (result?.error) {
      setServerError(result.error);
    }
    if (result?.fieldErrors) {
      setFieldErrors(result.fieldErrors);
    }
  });

  const handleGoogle = async () => {
    setServerError(null);
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/auth/redirect" });
  };

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <header className="space-y-2">
        <h1 className="font-heading text-[28px] font-extrabold leading-[1.1] tracking-tight text-foreground anim-slide-up gpu">
          Buat akun <span className="text-gradient">Spark</span>
        </h1>
        <p
          className="text-[13.5px] leading-relaxed text-muted-foreground anim-slide-up gpu"
          style={{ animationDelay: "80ms" }}
        >
          Gratis, tanpa batas, langsung bisa belajar.
        </p>
      </header>

      {/* ── Role Selector ── */}
      <div className="anim-slide-up gpu" style={{ animationDelay: "120ms" }}>
        <AuthRoleSelector value={role} onChange={handleRoleChange} />
      </div>

      {/* ── Google ── */}
      <div className="anim-slide-up gpu" style={{ animationDelay: "180ms" }}>
        <Button
          type="button"
          variant="outline"
          size="xl"
          disabled={googleLoading || isSubmitting}
          onClick={handleGoogle}
          className="group w-full flex items-center justify-center gap-2.5 rounded-2xl border-border/50 bg-card/40 text-[13.5px] font-bold shadow-sm hover:bg-card hover:shadow-md hover:border-border/80 transition-all cursor-pointer active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-[var(--coral)]/20"
        >
          {googleLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          Daftar dengan Google
        </Button>
      </div>

      <div className="anim-slide-up gpu" style={{ animationDelay: "210ms" }}>
        <AuthDivider
          label={`atau isi form${role === "PARENT" ? " + kode undangan" : ""}`}
        />
      </div>

      {/* ── Form ── */}
      <form
        key={role}
        onSubmit={onSubmit}
        className="space-y-3.5 anim-slide-up gpu"
        style={{ animationDelay: "240ms" }}
        noValidate
      >
        <input type="hidden" {...register("role" as never)} value={role} />

        <AuthField
          id="name"
          label="Nama Lengkap"
          autoComplete="name"
          placeholder="Nama kamu"
          layout="horizontal"
          error={
            (errors as Record<string, { message?: string }>).name?.message ??
            fieldErrors.name
          }
          {...register("name" as never)}
        />

        <AuthField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="kamu@email.com"
          layout="horizontal"
          error={
            (errors as Record<string, { message?: string }>).email?.message ??
            fieldErrors.email
          }
          {...register("email" as never)}
        />

        {role === "PARENT" && (
          <div className="animate-fade-in">
            <AuthField
              id="inviteCode"
              label="Kode Undangan Siswa"
              placeholder="Contoh: SPARK-12"
              autoComplete="off"
              layout="horizontal"
              error={
                (errors as Record<string, { message?: string }>).inviteCode
                  ?.message ?? fieldErrors.inviteCode
              }
              {...register("inviteCode" as never)}
            />
          </div>
        )}

        <div>
          <AuthField
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="Minimal 8 karakter"
            layout="horizontal"
            error={
              (errors as Record<string, { message?: string }>).password
                ?.message ?? fieldErrors.password
            }
            {...register("password" as never, {
              onChange: (e) => setPassword(e.target.value),
            })}
          />
          <PasswordStrength password={password} />
        </div>

        <div role="alert" aria-live="polite">
          <AuthError message={serverError ?? undefined} />
        </div>

        <Button
          type="submit"
          size="xl"
          disabled={isSubmitting || googleLoading}
          aria-busy={isSubmitting}
          className="group w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--coral)] to-[color-mix(in_oklch,var(--coral)_80%,var(--orange))] text-[14px] font-extrabold text-white shadow-[0_4px_16px_rgba(225,29,72,0.25)] hover:shadow-[0_8px_24px_rgba(225,29,72,0.35)] hover:brightness-105 transition-all duration-300 cursor-pointer active:scale-[0.97] focus-visible:ring-4 focus-visible:ring-[var(--coral)]/20"
        >
          {isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Rocket
              size={16}
              strokeWidth={2.2}
              className="transition-transform duration-200 group-hover:-translate-y-0.5"
            />
          )}
          {isSubmitting
            ? "Mendaftarkan..."
            : role === "STUDENT"
              ? "Mulai Belajar"
              : "Daftar sebagai Orang Tua"}
        </Button>
      </form>

      {/* ── Bottom ── */}
      <p
        className="text-center text-[13px] text-muted-foreground anim-slide-up gpu"
        style={{ animationDelay: "300ms" }}
      >
        Sudah punya akun?{" "}
        <Link
          href="/auth/login"
          className="font-bold text-[var(--coral)] hover:underline underline-offset-4 transition-all"
        >
          Masuk
        </Link>
      </p>

      {/* ── Trust badges (desktop only) ── */}
      <AuthTrustBadges />
    </div>
  );
}
