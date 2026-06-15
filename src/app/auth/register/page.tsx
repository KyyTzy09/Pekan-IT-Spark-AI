"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  GraduationCap,
  HeartHandshake,
  Loader2,
  Mail,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { z } from "zod";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AuthShell, GoogleIcon } from "@/components/auth/auth-shell";
import { AuthDivider, AuthError, AuthField } from "@/components/auth/auth-form";

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

const ROLE_CARDS = [
  {
    value: "STUDENT" as const,
    title: "Siswa",
    description: "Aku mau belajar bareng Spark",
    icon: GraduationCap,
    accent: "from-[var(--coral)] to-[var(--orange)]",
  },
  {
    value: "PARENT" as const,
    title: "Orang Tua",
    description: "Aku mau pantau belajar anak",
    icon: HeartHandshake,
    accent: "from-[var(--blue)] to-[var(--teal)]",
  },
] as const;

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
    reset,
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "STUDENT",
      name: "Rina Aulia",
      email: "rina@email.com",
      password: "rina12345",
    } as unknown as RegisterValues,
  });

  const handleRoleChange = (next: "STUDENT" | "PARENT") => {
    setRole(next);
    setServerError(null);
    reset({}, { keepValues: false });
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

  return (
    <AuthShell side="right">
      <div className="space-y-5">
        <header className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_oklch,var(--purple)_22%,transparent)] bg-[color-mix(in_oklch,var(--purple)_8%,transparent)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--purple)]">
            <Sparkles size={10} strokeWidth={2.5} />
            Daftar gratis
          </span>
          <h1 className="font-heading text-[26px] font-bold leading-tight tracking-tight">
            Mulai perjalanan belajarmu
          </h1>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Gratis untuk siswa. Daftar sekarang, langsung dapat tutor AI 24/7.
          </p>
        </header>

        <div className="space-y-2">
          <span className="text-[12px] font-semibold text-foreground/80">
            Daftar sebagai
          </span>
          <div
            role="radiogroup"
            aria-label="Pilih peran"
            className="grid grid-cols-2 gap-2.5"
          >
            {ROLE_CARDS.map((card) => {
              const Icon = card.icon;
              const active = role === card.value;
              return (
                <button
                  key={card.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => handleRoleChange(card.value)}
                  className={cn(
                    "group/role relative flex flex-col items-start gap-1.5 rounded-2xl border bg-background/70 p-3 text-left transition-all hover:-translate-y-0.5",
                    active
                      ? "border-transparent shadow-[0_8px_24px_rgba(80,20,50,0.12)] ring-2 ring-[var(--coral)]/40"
                      : "border-border/40 hover:border-border/70",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-xl bg-gradient-to-br text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-transform group-hover/role:-translate-y-0.5",
                      card.accent,
                    )}
                  >
                    <Icon size={16} strokeWidth={2.5} />
                  </span>
                  <span className="font-heading text-[14px] font-bold text-foreground">
                    {card.title}
                  </span>
                  <span className="text-[11.5px] leading-tight text-muted-foreground">
                    {card.description}
                  </span>
                  {active && (
                    <span
                      aria-hidden
                      className="absolute right-2.5 top-2.5 grid size-5 place-items-center rounded-full bg-[var(--coral)] text-white"
                    >
                      <Sparkles size={11} strokeWidth={2.5} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

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
          Daftar dengan Google
        </Button>

        <AuthDivider
          label={`atau daftar dengan email${
            role === "PARENT" ? " + kode undangan" : ""
          }`}
        />

        <form onSubmit={onSubmit} className="space-y-3.5" noValidate>
          <input type="hidden" {...register("role" as never)} value={role} />

          <AuthField
            id="name"
            label="Nama"
            autoComplete="name"
            placeholder="Nama kamu"
            layout="horizontal"
            error={
              (errors as Record<string, { message?: string }>).name?.message
            }
            rightSlot={
              <span className="grid size-8 place-items-center text-muted-foreground">
                <UserIcon size={15} />
              </span>
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
              (errors as Record<string, { message?: string }>).email?.message
            }
            rightSlot={
              <span className="grid size-8 place-items-center text-muted-foreground">
                <Mail size={15} />
              </span>
            }
            {...register("email" as never)}
          />

          {role === "PARENT" && (
            <AuthField
              id="inviteCode"
              label="Kode"
              placeholder="Kode undangan"
              autoComplete="off"
              layout="horizontal"
              error={
                (errors as Record<string, { message?: string }>).inviteCode
                  ?.message
              }
              {...register("inviteCode" as never)}
            />
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
            className="w-full rounded-2xl bg-[var(--coral)] text-[14px] font-bold text-white shadow-[0_8px_24px_rgba(225,29,72,0.35)] hover:bg-[var(--coral)]/90 hover:shadow-[0_12px_32px_rgba(225,29,72,0.5)]"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ArrowRight size={16} strokeWidth={2.5} />
            )}
            {isSubmitting
              ? "Membuat akun..."
              : role === "STUDENT"
                ? "Daftar & mulai belajar"
                : "Daftar sebagai orang tua"}
          </Button>
        </form>

        <p className="text-center text-[13px] text-muted-foreground">
          Sudah punya akun?{" "}
          <Link
            href="/auth/login"
            className="font-bold text-[var(--coral)] underline-offset-4 hover:underline"
          >
            Masuk
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
