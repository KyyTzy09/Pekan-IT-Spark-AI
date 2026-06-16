import { redirect } from "next/navigation";
import { MaterialsLibraryView } from "@/components/student/materials/materials-library-view";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMaterialLibrary } from "@/server/actions/challenges";

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  if (session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const [result, subjects] = await Promise.all([
    getMaterialLibrary({ limit: 50, offset: 0 }),
    prisma.subject.findMany({
      where: {
        materials: { some: { userId: session.user.id } },
      },
      select: { id: true, name: true, slug: true, icon: true, color: true },
      orderBy: { order: "asc" },
    }),
  ]);

  return (
    <MaterialsLibraryView
      initialResult={result}
      subjectOptions={subjects.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        icon: s.icon,
        color: s.color,
      }))}
    />
  );
}
