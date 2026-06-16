import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Database,
  FileQuestion,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { cn } from "@/lib/utils";
import type { AdminStats } from "@/server/actions/admin";

type Props = {
  stats: AdminStats;
  adminName: string;
};

export function AdminDashboard({ stats, adminName }: Props) {
  const firstName = adminName.split(" ")[0] ?? "Admin";

  const primary: Array<{
    label: string;
    value: string | number;
    sub?: string;
    icon: typeof Users;
    color: string;
    href?: string;
  }> = [
    {
      label: "Pengguna aktif",
      value: stats.activeUsers,
      sub: `${stats.totalStudents} siswa • ${stats.totalParents} ortu • ${stats.totalAdmins} admin`,
      icon: Users,
      color:
        "text-slate-700 bg-slate-100 dark:text-slate-200 dark:bg-slate-800",
    },
    {
      label: "Mapel menunggu",
      value: stats.pendingCustomSubjects,
      sub:
        stats.pendingCustomSubjects > 0
          ? "Perlu review segera"
          : "Semua mapel sudah diverifikasi",
      icon: AlertTriangle,
      color:
        stats.pendingCustomSubjects > 0
          ? "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/30"
          : "text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30",
      href: "/admin/custom-subjects?filter=pending",
    },
    {
      label: "Mapel terverifikasi",
      value: stats.verifiedCustomSubjects,
      sub: `dari ${stats.totalSubjects} total mapel`,
      icon: CheckCircle2,
      color:
        "text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/30",
    },
    {
      label: "Tantangan hari ini",
      value: stats.totalChallengesToday,
      sub: "Auto-generated untuk semua siswa",
      icon: Sparkles,
      color:
        "text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30",
    },
  ];

  const secondary: Array<{
    label: string;
    value: string | number;
    icon: typeof Database;
  }> = [
    { label: "Total mapel", value: stats.totalSubjects, icon: BookOpen },
    {
      label: "Bank soal aktif",
      value: stats.totalQuestions,
      icon: FileQuestion,
    },
    { label: "Total materi AI", value: stats.totalMaterials, icon: Database },
    {
      label: "Dokumen diupload",
      value: stats.totalDocuments,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6 pb-20">
      <header className="space-y-1">
        <p className="text-[10.5px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Admin Panel
        </p>
        <h1 className="font-heading text-[28px] font-extrabold leading-tight text-foreground sm:text-[34px]">
          Halo, {firstName} 👋
        </h1>
        <p className="text-[13.5px] leading-relaxed text-muted-foreground">
          {stats.pendingCustomSubjects > 0
            ? `Ada ${stats.pendingCustomSubjects} mapel custom yang perlu review. Yuk cek dan approve biar siswa lain bisa pakai.`
            : "Semua mapel sudah diverifikasi. Mantap. ✨"}
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {primary.map((s) => {
          const Icon = s.icon;
          return s.href ? (
            <Link
              key={s.label}
              href={s.href}
              className="block transition-transform hover:scale-[1.02]"
            >
              <AdminStatCard
                icon={<Icon size={18} />}
                value={s.value}
                label={s.label}
                sub={s.sub}
                color={s.color}
              />
            </Link>
          ) : (
            <div key={s.label}>
              <AdminStatCard
                icon={<Icon size={18} />}
                value={s.value}
                label={s.label}
                sub={s.sub}
                color={s.color}
              />
            </div>
          );
        })}
      </section>

      <section className="rounded-2xl border border-border/40 bg-card/60 p-5 backdrop-blur-md">
        <h2 className="font-heading text-[15px] font-bold text-foreground">
          Statistik sistem
        </h2>
        <p className="mt-0.5 text-[11.5px] text-muted-foreground">
          Snapshot data real-time dari database
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {secondary.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="rounded-xl border border-border/40 bg-background/50 p-3"
              >
                <div className="mb-1.5 flex items-center gap-1.5 text-muted-foreground">
                  <Icon size={12} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {s.label}
                  </span>
                </div>
                <p className="font-heading text-[18px] font-extrabold leading-none text-foreground">
                  {s.value.toLocaleString("id-ID")}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-5 dark:border-slate-700 dark:bg-slate-900/20">
        <h2 className="font-heading text-[14px] font-bold text-foreground">
          🛠️ Segera hadir (Phase 10)
        </h2>
        <p className="mt-0.5 text-[11.5px] text-muted-foreground">
          Modul admin lain yang akan diimplementasi bertahap
        </p>
        <ul className="mt-3 space-y-1.5 text-[11.5px] text-muted-foreground">
          <li>• CRUD users (siswa, orang tua, admin) — ban/suspend</li>
          <li>• CRUD subjects, topics, concepts (admin override)</li>
          <li>• Bank soal management + validasi kurikulum</li>
          <li>• Kelola badges & achievements (CRUD)</li>
          <li>• Review flagged chat messages</li>
          <li>• Full audit log UI (server ready, UI coming)</li>
        </ul>
      </section>
    </div>
  );
}

function AdminStatCard({
  icon,
  value,
  label,
  sub,
  color,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  sub?: string;
  color: string;
}) {
  return (
    <article className="relative h-full overflow-hidden rounded-2xl border border-border/40 bg-card/70 p-4 shadow-sm backdrop-blur-md">
      <div
        className={cn("mb-3 grid size-10 place-items-center rounded-xl", color)}
      >
        {icon}
      </div>
      <p className="font-heading text-[26px] font-extrabold leading-none text-foreground">
        {value}
      </p>
      <p className="mt-1.5 text-[11.5px] font-bold text-foreground">{label}</p>
      {sub && (
        <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
          {sub}
        </p>
      )}
    </article>
  );
}
