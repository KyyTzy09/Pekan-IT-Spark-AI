"use client";

import { BookOpen, CheckCircle2, ShieldOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import type {
  CustomSubjectFilter,
  CustomSubjectListItem,
} from "@/server/actions/admin";
import { CustomSubjectCard } from "./custom-subject-card";

const FILTERS: Array<{
  key: CustomSubjectFilter;
  label: string;
  icon: typeof BookOpen;
  color: string;
}> = [
  {
    key: "pending",
    label: "Menunggu",
    icon: BookOpen,
    color: "text-amber-700",
  },
  {
    key: "verified",
    label: "Terverifikasi",
    icon: CheckCircle2,
    color: "text-emerald-700",
  },
  {
    key: "rejected",
    label: "Ditolak",
    icon: ShieldOff,
    color: "text-red-700",
  },
  {
    key: "all",
    label: "Semua",
    icon: BookOpen,
    color: "text-slate-700",
  },
];

type Props = {
  initialFilter: CustomSubjectFilter;
  items: CustomSubjectListItem[];
  total: number;
};

export function CustomSubjectsList({ initialFilter, items, total }: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const [pending, startTransition] = useTransition();

  const setFilter = (filter: CustomSubjectFilter) => {
    const params = new URLSearchParams(search);
    params.set("filter", filter);
    startTransition(() => {
      router.push(`/admin/custom-subjects?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-5 pb-20">
      <header className="space-y-1">
        <p className="text-[10.5px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Review
        </p>
        <h1 className="font-heading text-[26px] font-extrabold leading-tight text-foreground sm:text-[30px]">
          Verifikasi Mapel Custom
        </h1>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Approve mapel custom supaya bisa dishare ke siswa lain. Reject = soft
          delete (data tetap tersimpan untuk audit).
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const active = initialFilter === f.key;
          const Icon = f.icon;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11.5px] font-bold transition-all",
                active
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-border/50 bg-card/60 text-muted-foreground hover:border-slate-300 hover:text-foreground",
              )}
            >
              <Icon size={12} />
              {f.label}
            </button>
          );
        })}
        <span className="ml-auto text-[11px] font-medium text-muted-foreground">
          {pending ? "Memuat…" : `${total} mapel`}
        </span>
      </div>

      {items.length === 0 ? (
        <EmptyState filter={initialFilter} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {items.map((item) => (
            <CustomSubjectCard key={item.id} subject={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ filter }: { filter: CustomSubjectFilter }) {
  const message = {
    pending: "Tidak ada mapel yang perlu di-review. ✨",
    verified: "Belum ada mapel custom yang terverifikasi.",
    rejected: "Belum ada mapel custom yang ditolak.",
    all: "Belum ada mapel custom sama sekali.",
  }[filter];

  return (
    <div className="rounded-2xl border border-dashed border-border/50 bg-card/30 p-10 text-center">
      <CheckCircle2 className="mx-auto mb-3 text-emerald-500" size={28} />
      <p className="text-[13px] font-semibold text-foreground">{message}</p>
      <p className="mt-1 text-[11.5px] text-muted-foreground">
        Mapel custom dibuat siswa lewat AI Curriculum Designer.
      </p>
    </div>
  );
}
