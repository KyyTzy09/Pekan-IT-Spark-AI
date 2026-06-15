"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AuthError, AuthField } from "@/components/auth/auth-form";
import { Button } from "@/components/ui/button";
import { linkChildWithCode } from "@/server/actions/invite";

const linkSchema = z.object({
  inviteCode: z
    .string()
    .min(4, "Kode undangan minimal 4 karakter")
    .max(32, "Kode undangan maksimal 32 karakter"),
});

type LinkValues = z.infer<typeof linkSchema>;

export function ParentLinkForm() {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LinkValues>({
    resolver: zodResolver(linkSchema),
    defaultValues: { inviteCode: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setSuccess(null);
    const result = await linkChildWithCode(values);
    if (!result.ok) {
      setServerError(result.message);
      return;
    }
    setSuccess(
      `Mantap! ${result.studentName ?? "Anak kamu"} udah terhubung. Yuk, cek perkembangannya.`,
    );
    reset();
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="rounded-2xl border border-border/40 bg-card/60 p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--blue)] to-[var(--teal)] text-white">
            <KeyRound size={16} strokeWidth={2.5} />
          </span>
          <div>
            <p className="font-heading text-[14px] font-bold text-foreground">
              Kode undangan
            </p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
              Anak kamu bisa bikin kode di halaman{" "}
              <span className="font-semibold text-foreground/80">
                Pengaturan &gt; Undang Orang Tua
              </span>{" "}
              di akun siswa-nya.
            </p>
          </div>
        </div>
      </div>

      <AuthField
        id="inviteCode"
        label="Kode undangan"
        placeholder="Contoh: AB12CD34"
        autoComplete="off"
        layout="stacked"
        error={errors.inviteCode?.message}
        hint="Bebas huruf besar, kecil, atau angka. Contoh: AB12CD34"
        {...register("inviteCode")}
      />

      {success && (
        // biome-ignore lint/a11y/useSemanticElements: div with status role is valid here
        <div
          role="status"
          className="flex items-start gap-2 rounded-2xl border border-[var(--teal)]/30 bg-[color-mix(in_oklch,var(--teal)_10%,transparent)] px-3.5 py-2.5 text-[12.5px] font-medium text-[var(--teal)]"
        >
          <Sparkles size={13} className="mt-0.5 shrink-0" strokeWidth={2.5} />
          {success}
        </div>
      )}

      <AuthError message={serverError ?? undefined} />

      <Button
        type="submit"
        size="xl"
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-[var(--coral)] text-[14px] font-bold text-white shadow-[0_8px_24px_rgba(225,29,72,0.35)] hover:bg-[var(--coral)]/90 hover:shadow-[0_12px_32px_rgba(225,29,72,0.5)]"
      >
        {isSubmitting ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Sparkles size={16} strokeWidth={2.5} />
        )}
        {isSubmitting ? "Menghubungkan..." : "Hubungkan"}
      </Button>
    </form>
  );
}
