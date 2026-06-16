import { redirect } from "next/navigation";
import { SubjectForm } from "@/components/admin/subject-form";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NewSubjectPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  if (session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="space-y-5 pb-20">
      <header className="space-y-1">
        <p className="text-[10.5px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Konten / Mapel
        </p>
        <h1 className="font-heading text-[26px] font-extrabold leading-tight text-foreground sm:text-[30px]">
          Mapel Baru
        </h1>
        <p className="text-[12.5px] text-muted-foreground">
          Tambah mata pelajaran ke kurikulum. Topik & konsep bisa ditambah
          setelah mapel dibuat.
        </p>
      </header>

      <SubjectForm mode="create" />
    </div>
  );
}
