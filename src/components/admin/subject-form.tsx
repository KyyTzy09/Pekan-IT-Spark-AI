"use client";

import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import type { AdminSubjectDetail } from "@/server/actions/admin-content";
import { createSubject, updateSubject } from "@/server/actions/admin-content";

type Mode = "create" | "edit";

type Props = {
  mode: Mode;
  subject?: AdminSubjectDetail;
};

const SOURCES = [
  { value: "OFFICIAL", label: "OFFICIAL (kurikulum nasional)" },
  { value: "AI_GENERATED", label: "AI_GENERATED" },
  { value: "USER_CREATED", label: "USER_CREATED" },
] as const;

export function SubjectForm({ mode, subject }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    slug: subject?.slug ?? "",
    name: subject?.name ?? "",
    description: subject?.description ?? "",
    icon: subject?.icon ?? "",
    color: subject?.color ?? "#3b82f6",
    order: subject?.order ?? 0,
    isCustom: subject?.isCustom ?? false,
    source:
      (subject?.source as "OFFICIAL" | "AI_GENERATED" | "USER_CREATED") ??
      "OFFICIAL",
    isVerified: subject?.isVerified ?? true,
    isActive: subject?.isActive ?? true,
  });

  const update = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        if (mode === "create") {
          const result = await createSubject({
            slug: form.slug,
            name: form.name,
            description: form.description || null,
            icon: form.icon || null,
            color: form.color || null,
            order: form.order,
            isCustom: form.isCustom,
            source: form.source,
            isVerified: form.isVerified,
          });
          if (!result.ok) {
            setError(result.error ?? "Gagal membuat mapel");
            return;
          }
          setSuccess("Mapel dibuat!");
          setTimeout(() => router.push(`/admin/subjects/${result.id}`), 600);
        } else if (subject) {
          const result = await updateSubject({
            subjectId: subject.id,
            name: form.name,
            description: form.description || null,
            icon: form.icon || null,
            color: form.color || null,
            order: form.order,
            isActive: form.isActive,
            isVerified: form.isVerified,
          });
          if (!result.ok) {
            setError(result.error ?? "Gagal update mapel");
            return;
          }
          setSuccess("Tersimpan!");
          setTimeout(() => router.refresh(), 600);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Link
        href="/admin/subjects"
        className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={12} />
        Kembali
      </Link>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[12px] font-semibold text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-[12px] font-semibold text-emerald-700 dark:text-emerald-300">
          {success}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="space-y-3 rounded-2xl border border-border/40 bg-card/60 p-4 lg:col-span-2">
          <Field
            label="Slug"
            hint="Lowercase + underscore, mis: 'matematika', 'bahasa_arab'"
            required
          >
            <input
              type="text"
              value={form.slug}
              onChange={(e) => update("slug", e.target.value)}
              disabled={mode === "edit"}
              required
              className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 font-mono text-[12.5px] outline-none focus:border-slate-400 disabled:opacity-60"
            />
          </Field>

          <Field label="Nama" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
              maxLength={100}
              className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-[13px] font-bold outline-none focus:border-slate-400"
            />
          </Field>

          <Field label="Deskripsi" hint="Maks 500 karakter">
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full resize-none rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-[12.5px] outline-none focus:border-slate-400"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Icon (emoji atau single char)">
              <input
                type="text"
                value={form.icon}
                onChange={(e) => update("icon", e.target.value)}
                maxLength={4}
                placeholder="🔢"
                className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-center text-[20px] outline-none focus:border-slate-400"
              />
            </Field>
            <Field label="Color (hex)" hint="Mis: #3b82f6">
              <input
                type="text"
                value={form.color}
                onChange={(e) => update("color", e.target.value)}
                pattern="^#[0-9a-fA-F]{6}$"
                placeholder="#3b82f6"
                className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 font-mono text-[12.5px] outline-none focus:border-slate-400"
              />
            </Field>
          </div>
        </section>

        <section className="space-y-3 rounded-2xl border border-border/40 bg-card/60 p-4">
          <h2 className="font-heading text-[13px] font-bold text-foreground">
            Status & ordering
          </h2>

          <Field label="Order" hint="0 = pertama">
            <input
              type="number"
              min={0}
              max={999}
              value={form.order}
              onChange={(e) => update("order", Number(e.target.value))}
              className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 font-mono text-[12.5px] outline-none focus:border-slate-400"
            />
          </Field>

          {mode === "create" && (
            <Field label="Source">
              <select
                value={form.source}
                onChange={(e) =>
                  update(
                    "source",
                    e.target.value as
                      | "OFFICIAL"
                      | "AI_GENERATED"
                      | "USER_CREATED",
                  )
                }
                className="w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-[12px] outline-none focus:border-slate-400"
              >
                {SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <div className="space-y-2">
            <ToggleField
              label="Mapel custom"
              description="Buatan user, bukan kurikulum nasional"
              checked={form.isCustom}
              onChange={(v) => update("isCustom", v)}
              disabled={mode === "edit"}
            />
            <ToggleField
              label="Aktif"
              description="Ditampilkan ke siswa"
              checked={form.isActive}
              onChange={(v) => update("isActive", v)}
            />
            <ToggleField
              label="Verified"
              description="Sudah disetujui admin"
              checked={form.isVerified}
              onChange={(v) => update("isVerified", v)}
            />
          </div>
        </section>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Link
          href="/admin/subjects"
          className="rounded-xl border border-border/50 bg-card/60 px-4 py-2 text-[12px] font-bold text-muted-foreground hover:text-foreground"
        >
          Batal
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-[12px] font-bold text-white shadow-sm transition-all hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          {mode === "create" ? "Buat Mapel" : "Simpan Perubahan"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: input is a child via children
    <label className="block space-y-1">
      <span className="text-[10.5px] font-bold uppercase tracking-wider text-foreground">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
      {hint && (
        <span className="block text-[10px] text-muted-foreground">{hint}</span>
      )}
    </label>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-2 rounded-lg border border-border/40 bg-background/40 p-2.5",
        disabled && "opacity-60",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-0.5 size-4 accent-slate-900"
      />
      <div>
        <p className="text-[11.5px] font-bold text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground">{description}</p>
      </div>
    </label>
  );
}
