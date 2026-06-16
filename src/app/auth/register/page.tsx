"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { GraduationCap, HeartHandshake, Loader2, Rocket } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { cn } from "@/lib/utils";

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

const ROLES = [
  {
    id: "STUDENT" as const,
    icon: GraduationCap,
    label: "Siswa",
    desc: "Belajar dengan tutor AI",
    color: "var(--coral)",
  },
  {
    id: "PARENT" as const,
    icon: HeartHandshake,
    label: "Orang Tua",
    desc: "Pantau progress anak",
    color: "var(--blue)",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [role, setRole] = React.useState<"STUDENT" | "PARENT">("STUDENT");

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

  const handleRoleChange = (next: "STUDENT" | "PARENT") => {
    setRole(next);
    setServerError(null);
    setValue("role" as never, next as never, { shouldValidate: false });
  };

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);

    if (values.role === "PARENT" && !values.inviteCode) {
      setServerError(
        "Minta kode undangan ke anak kamu dulu, ya. Kode bisa dibuat di halaman profil siswa nanti.",
      );
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setServerError(data.message || "Gagal daftar. Coba lagi, ya.");
      return;
    }

    const signin = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (!signin || signin.error) {
      router.push("/auth/login?registered=1");
      return;
    }

    if (values.role === "STUDENT") {
      router.push("/onboarding");
    } else {
      router.push("/parent");
    }
    router.refresh();
  });

  const handleGoogle = async () => {
    setServerError(null);
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/onboarding" });
  };

  const _activeRole = ROLES.find((r) => r.id === role);

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

      {/* ── Role Selector — Card style ── */}
      <div className="anim-slide-up gpu" style={{ animationDelay: "120ms" }}>
        <div className="grid grid-cols-2 gap-2.5">
          {ROLES.map((r) => {
            const active = role === r.id;
            const Icon = r.icon;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRoleChange(r.id)}
                className={cn(
                  "group relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all duration-200 cursor-pointer focus:outline-none",
                  active
                    ? "border-transparent shadow-md"
                    : "border-border/40 bg-card/20 hover:bg-card/50 hover:border-border/60",
                )}
                style={
                  active
                    ? {
                        background: `color-mix(in oklch, ${r.color} 8%, var(--background))`,
                        borderColor: `color-mix(in oklch, ${r.color} 25%, transparent)`,
                      }
                    : undefined
                }
              >
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                    active ? "shadow-sm" : "",
                  )}
                  style={{
                    backgroundColor: active
                      ? `color-mix(in oklch, ${r.color} 15%, transparent)`
                      : undefined,
                    color: active ? r.color : undefined,
                  }}
                >
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.2 : 1.8}
                    className={cn(
                      "transition-all duration-200",
                      !active && "text-muted-foreground",
                    )}
                  />
                </span>
                <div>
                  <p
                    className={cn(
                      "text-[13px] font-bold transition-colors",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {r.label}
                  </p>
                  <p className="text-[10.5px] text-muted-foreground/70">
                    {r.desc}
                  </p>
                </div>
                {/* Active indicator dot */}
                {active && (
                  <span
                    className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-white shadow-sm animate-bounce-in"
                    style={{ backgroundColor: r.color }}
                  >
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      className="size-3"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 8.5 6.5 11 12 5" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Google ── */}
      <div className="anim-slide-up gpu" style={{ animationDelay: "180ms" }}>
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
          error={(errors as Record<string, { message?: string }>).name?.message}
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
            (errors as Record<string, { message?: string }>).email?.message
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
                  ?.message
              }
              {...register("inviteCode" as never)}
            />
          </div>
        )}

        <AuthField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="Minimal 8 karakter"
          layout="horizontal"
          error={
            (errors as Record<string, { message?: string }>).password?.message
          }
          {...register("password" as never)}
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
    </div>
  );
}
