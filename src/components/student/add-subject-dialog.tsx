"use client";

import { gooeyToast } from "goey-toast";
import { Loader2, Plus, Sparkles, Wand2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { addCustomSubject } from "@/server/actions/subjects";

const SUGGESTED_OFFICIAL = [
  { name: "Sejarah Indonesia", icon: "📜", color: "#A78BFA" },
  { name: "Geografi", icon: "🌍", color: "#10B981" },
  { name: "Ekonomi", icon: "💰", color: "#F59E0B" },
  { name: "Sosiologi", icon: "👥", color: "#EC4899" },
  { name: "PPKN", icon: "🏛️", color: "#3B82F6" },
  { name: "Seni Budaya", icon: "🎨", color: "#F43F5E" },
];

const SUGGESTED_CUSTOM = [
  "Bahasa Jawa",
  "Bahasa Arab",
  "Coding",
  "Desain Grafis",
  "Musik",
  "Fotografi",
  "Public Speaking",
  "Bahasa Korea",
];

type Status = "idle" | "loading" | "success" | "error";

export function AddSubjectDialog({ trigger }: { trigger?: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState<"suggest" | "custom">("suggest");
  const [name, setName] = React.useState("");
  const [context, setContext] = React.useState("");
  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState<string | null>(null);

  const handleCustom = React.useCallback(async () => {
    if (name.trim().length < 2) {
      setError("Nama mapel minimal 2 karakter ya");
      return;
    }
    setStatus("loading");
    setError(null);
    const res = await addCustomSubject({
      name: name.trim(),
      context: context.trim() || undefined,
    });
    if (!res.ok) {
      setStatus("error");
      setError(res.error);
      gooeyToast.error("Gagal menambahkan mapel", { description: res.error });
      return;
    }
    setStatus("success");
    gooeyToast.success("Mata pelajaran baru berhasil ditambahkan!", {
      description: `Spark telah membuat pretest & materi untuk ${name.trim()}.`,
    });
    setTimeout(() => {
      setOpen(false);
      router.push(`/practice/pretest/${res.subjectId}`);
      router.refresh();
    }, 1200);
  }, [name, context, router]);

  const handleClose = () => {
    if (status === "loading") return;
    setOpen(false);
    setTimeout(() => {
      setStatus("idle");
      setError(null);
      setName("");
      setContext("");
      setTab("suggest");
    }, 200);
  };

  return (
    <>
      {trigger ? (
        <span
          role="button"
          tabIndex={0}
          onClick={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setOpen(true);
          }}
          className="contents"
        >
          {trigger}
        </span>
      ) : (
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-[var(--coral)] text-white shadow-[0_6px_18px_rgba(225,29,72,0.35)]"
        >
          <Plus size={14} strokeWidth={2.5} />
          Tambah Mapel
        </Button>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-subject-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <button
            type="button"
            aria-label="Tutup"
            onClick={handleClose}
            className="absolute inset-0 -z-10 cursor-default"
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-t-3xl border border-border/40 bg-card shadow-[0_-12px_40px_rgba(80,20,50,0.18)] backdrop-blur-xl sm:rounded-3xl sm:shadow-[0_24px_60px_rgba(80,20,50,0.25)]">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-30 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.78 0.18 25 / 0.5), transparent 70%)",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-16 -left-16 size-40 rounded-full opacity-25 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.7 0.15 200 / 0.4), transparent 70%)",
              }}
            />

            <header className="relative flex items-start justify-between gap-3 border-border/40 border-b p-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--purple)]">
                  Mata pelajaran baru
                </p>
                <h2
                  id="add-subject-title"
                  className="mt-1 font-heading text-[20px] font-bold leading-tight"
                >
                  Mau belajar apa lagi hari ini? ✨
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={status === "loading"}
                className="grid size-9 shrink-0 place-items-center rounded-full border border-border/40 bg-background/60 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-background disabled:opacity-40"
                aria-label="Tutup"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </header>

            <div className="relative border-border/40 border-b bg-background/30 p-1.5 backdrop-blur-sm">
              <div className="flex gap-1">
                <TabButton
                  active={tab === "suggest"}
                  onClick={() => setTab("suggest")}
                >
                  <Sparkles size={12} strokeWidth={2.5} />
                  Mapel nasional
                </TabButton>
                <TabButton
                  active={tab === "custom"}
                  onClick={() => setTab("custom")}
                >
                  <Wand2 size={12} strokeWidth={2.5} />
                  Custom + AI
                </TabButton>
              </div>
            </div>

            <div className="relative max-h-[60vh] overflow-y-auto p-5 sm:max-h-[480px]">
              {tab === "suggest" && <SuggestTab />}
              {tab === "custom" && (
                <CustomTab
                  name={name}
                  context={context}
                  status={status}
                  error={error}
                  onNameChange={setName}
                  onContextChange={setContext}
                  onPick={(v) => setName(v)}
                  onSubmit={handleCustom}
                />
              )}
              {status === "success" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/95 p-6 backdrop-blur-md">
                  <div className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-[var(--teal)] to-[var(--blue)] text-white shadow-[0_8px_24px_rgba(20,184,166,0.4)]">
                    <Sparkles size={28} strokeWidth={2.5} />
                  </div>
                  <p className="font-heading text-[18px] font-bold">
                    Beres! Mapel kamu siap 🎉
                  </p>
                  <p className="text-center text-[12.5px] text-muted-foreground">
                    Spark udah bikinin outline + 5 soal pretest buat ukur
                    kemampuan awal kamu.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[11.5px] font-bold transition-all",
        active
          ? "bg-[var(--coral)] text-white shadow-[0_4px_12px_rgba(225,29,72,0.3)]"
          : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function SuggestTab() {
  return (
    <div className="space-y-4">
      <p className="text-[12.5px] leading-relaxed text-muted-foreground">
        Mapel nasional Kurikulum Merdeka yang sering dipelajarin siswa SMA/SMK.
        Pilih salah satu, nanti Spark langsung generate outline + soal pretest.
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {SUGGESTED_OFFICIAL.map((m) => (
          <div
            key={m.name}
            className="group/it relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-3"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-8 size-20 rounded-full opacity-30 blur-2xl"
              style={{ background: `${m.color}55` }}
            />
            <div className="relative flex items-center gap-2.5">
              <span
                className="grid size-9 shrink-0 place-items-center rounded-xl text-white shadow-[0_4px_10px_rgba(0,0,0,0.1)]"
                style={{
                  background: `linear-gradient(135deg, ${m.color}, oklch(0.65 0.15 60))`,
                }}
              >
                <span className="text-[15px]">{m.icon}</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-[12.5px] font-bold">
                  {m.name}
                </p>
                <p className="text-[9.5px] font-bold uppercase tracking-widest text-muted-foreground">
                  Segera hadir
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-[var(--teal)]/30 bg-[var(--teal)]/5 p-3.5 text-[12px] leading-relaxed text-foreground/80">
        <p className="font-bold text-[var(--teal)]">💡 Tips</p>
        <p className="mt-1">
          Mau mapel yang belum ada? Pindah ke tab <b>Custom + AI</b> — Spark
          bisa bikin outline & soal pretest sesuai nama mapel yang kamu mau.
        </p>
      </div>
    </div>
  );
}

function CustomTab({
  name,
  context,
  status,
  error,
  onNameChange,
  onContextChange,
  onPick,
  onSubmit,
}: {
  name: string;
  context: string;
  status: Status;
  error: string | null;
  onNameChange: (v: string) => void;
  onContextChange: (v: string) => void;
  onPick: (v: string) => void;
  onSubmit: () => void;
}) {
  const charLeft = 280 - context.length;
  const loading = status === "loading";
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--purple)]/25 bg-[var(--purple)]/5 p-3.5 text-[12px] leading-relaxed text-foreground/80">
        <p className="font-bold text-[var(--purple)]">🪄 Spark AI bakal:</p>
        <ul className="mt-1.5 space-y-1 pl-4">
          <li>• Bikin 3-6 topik sesuai mapel kamu</li>
          <li>• Generate 3-6 konsep per topik</li>
          <li>• Bikin 5-8 soal pretest untuk ukur kemampuan awal</li>
        </ul>
      </div>

      <div>
        <label
          htmlFor="subject-name"
          className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
        >
          Nama mapel
        </label>
        <Input
          id="subject-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="cth: Bahasa Jawa, Coding, Musik…"
          maxLength={60}
          disabled={loading}
          className="mt-1.5 h-11 rounded-2xl border-border/50 bg-background/70 text-[14px] font-semibold backdrop-blur-sm"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="subject-context"
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
          >
            Konteks tambahan (opsional)
          </label>
          <span
            className={cn(
              "text-[10px] font-bold tabular-nums",
              charLeft < 30 ? "text-[var(--coral)]" : "text-muted-foreground",
            )}
          >
            {charLeft}
          </span>
        </div>
        <textarea
          id="subject-context"
          value={context}
          onChange={(e) => onContextChange(e.target.value)}
          placeholder="Bisa kasih tau Spark ini mapel tentang apa, level kamu, atau fokus yang kamu mau. Boleh kosong."
          maxLength={280}
          rows={3}
          disabled={loading}
          className="mt-1.5 w-full resize-none rounded-2xl border border-border/50 bg-background/70 px-4 py-2.5 text-[13px] font-medium leading-relaxed backdrop-blur-sm transition-colors placeholder:text-muted-foreground/60 focus:border-[var(--coral)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/15 disabled:opacity-50"
        />
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Atau pilih ide populer:
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SUGGESTED_CUSTOM.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onPick(s)}
              disabled={loading}
              className="rounded-full border border-border/40 bg-background/60 px-3 py-1 text-[11.5px] font-bold text-foreground/85 transition-all hover:-translate-y-0.5 hover:border-[var(--coral)]/40 hover:bg-[var(--coral)]/8 hover:text-[var(--coral)] disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-[var(--coral)]/30 bg-[var(--coral)]/8 p-3 text-[12px] leading-relaxed text-[var(--coral)]">
          ⚠️ {error}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button
          type="button"
          onClick={onSubmit}
          disabled={loading || name.trim().length < 2}
          className="h-11 flex-1 rounded-full bg-[var(--coral)] font-bold text-white shadow-[0_8px_22px_rgba(225,29,72,0.35)] disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" strokeWidth={2.5} />
              Spark lagi mikir keras…
            </>
          ) : (
            <>
              <Wand2 size={15} strokeWidth={2.5} />
              Generate pake Spark AI
            </>
          )}
        </Button>
      </div>

      <p className="text-center text-[10.5px] text-muted-foreground">
        ⏱️ Biasanya 8-15 detik. Outline + soal pretest langsung tersimpan.
      </p>
    </div>
  );
}
