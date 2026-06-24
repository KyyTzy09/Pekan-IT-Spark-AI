"use client";

import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Plus,
  Search,
  ShieldOff,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { AdminSubjectListItem } from "@/server/actions/admin-content";

type ShowFilter = "active" | "all" | "inactive" | "unverified";

const SHOW_OPTIONS: Array<{
  key: ShowFilter;
  label: string;
  color: string;
}> = [
  { key: "active", label: "Aktif", color: "text-emerald-700" },
  { key: "unverified", label: "Belum verified", color: "text-amber-700" },
  { key: "inactive", label: "Non-aktif", color: "text-red-700" },
  { key: "all", label: "Semua", color: "text-slate-700" },
];

type Props = {
  initialItems: AdminSubjectListItem[];
  total: number;
  search: string;
  showFilter: ShowFilter;
};

export function SubjectsTable({
  initialItems,
  total,
  search,
  showFilter,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const setShow = (next: ShowFilter) => {
    const params = new URLSearchParams(searchParams);
    if (next === "active") params.delete("show");
    else params.set("show", next);
    startTransition(() => router.push(`/admin/subjects?${params.toString()}`));
  };

  const setSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set("search", value);
    else params.delete("search");
    startTransition(() => router.push(`/admin/subjects?${params.toString()}`));
  };

  return (
    <div className="space-y-5 pb-20">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Konten
          </p>
          <h1 className="font-heading text-[26px] font-extrabold leading-tight text-foreground sm:text-[30px]">
            Mata Pelajaran
          </h1>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            {pending ? "Memuat…" : `${total} mapel`}
          </p>
        </div>
        <Link
          href="/admin/subjects/new"
          className="inline-flex items-center gap-1.5 self-start rounded-xl bg-slate-900 px-3.5 py-2 text-[12px] font-bold text-white shadow-sm transition-all hover:bg-slate-800 sm:self-auto"
        >
          <Plus size={14} />
          Mapel Baru
        </Link>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            defaultValue={search}
            onChange={(e) => {
              const value = e.target.value;
              if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
              searchTimeoutRef.current = setTimeout(() => {
                startTransition(() => {
                  const params = new URLSearchParams(searchParams);
                  if (value) params.set("search", value);
                  else params.delete("search");
                  router.push(`/admin/subjects?${params.toString()}`);
                });
              }, 300);
            }}
            placeholder="Cari nama atau slug…"
            className="w-full rounded-xl border border-border/50 bg-card/60 py-2 pl-9 pr-3 text-[12.5px] text-foreground outline-none transition-colors focus:border-slate-400"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {SHOW_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setShow(opt.key)}
              className={cn(
                "rounded-full border px-3 py-1 text-[10.5px] font-bold transition-all",
                showFilter === opt.key
                  ? "border-slate-900 bg-slate-900 text-white"
                  : `border-border/50 bg-card/60 text-muted-foreground hover:border-slate-300 ${opt.color}`,
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {initialItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/50 bg-card/30 p-10 text-center">
          <BookOpen className="mx-auto mb-3 text-muted-foreground" size={28} />
          <p className="text-[13px] font-semibold text-foreground">
            Tidak ada mapel
          </p>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            Coba ubah filter atau tambah mapel baru.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/40 bg-card/60">
          <table className="w-full text-left text-[12px]">
            <thead className="border-b border-border/40 bg-background/30 text-[10.5px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5 font-bold">Mapel</th>
                <th className="px-3 py-2.5 font-bold">Slug</th>
                <th className="px-3 py-2.5 font-bold">Tipe</th>
                <th className="px-3 py-2.5 text-center font-bold">Topik</th>
                <th className="px-3 py-2.5 text-center font-bold">Konsep</th>
                <th className="px-3 py-2.5 text-center font-bold">Soal</th>
                <th className="px-3 py-2.5 font-bold">Status</th>
                <th className="px-3 py-2.5 text-right font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {initialItems.map((s) => {
                const status = !s.isActive
                  ? "inactive"
                  : s.isVerified
                    ? "verified"
                    : "pending";
                return (
                  <tr
                    key={s.id}
                    className="border-b border-border/30 transition-colors last:border-b-0 hover:bg-background/40"
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="grid size-7 shrink-0 place-items-center rounded-lg text-[14px] shadow-sm"
                          style={
                            s.color
                              ? {
                                  background: `${s.color}25`,
                                  color: s.color,
                                }
                              : undefined
                          }
                        >
                          {s.icon ?? <BookOpen size={14} />}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-foreground">
                            {s.name}
                          </p>
                          {s.description && (
                            <p className="truncate text-[10.5px] text-muted-foreground">
                              {s.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[10.5px] text-muted-foreground">
                      {s.slug}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider",
                          s.isCustom
                            ? "bg-purple-500/15 text-purple-700 dark:text-purple-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                        )}
                      >
                        {s.isCustom ? "Custom" : s.source}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-foreground">
                      {s.topicCount}
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-foreground">
                      {s.conceptCount}
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-foreground">
                      {s.questionCount}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={status} />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Link
                        href={`/admin/subjects/${s.id}`}
                        className="text-[11.5px] font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300"
                      >
                        Edit →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "verified" | "pending" | "inactive";
}) {
  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 size={10} />
        Aktif
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
        <AlertTriangle size={10} />
        Belum verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-red-700 dark:text-red-300">
      <ShieldOff size={10} />
      Non-aktif
    </span>
  );
}
