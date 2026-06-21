import { redirect } from "next/navigation";
import { SubjectsTable } from "@/components/admin/subjects-table";
import { getSession } from "@/lib/session";
import { listAllSubjects } from "@/server/actions/admin-content";

export const dynamic = "force-dynamic";

type Search = {
  search?: string;
  show?: string;
};

export default async function SubjectsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const session = await getSession();
  if (!session?.id) redirect("/auth/login");
  if (session.role !== "ADMIN") redirect("/");

  const params = await searchParams;
  const includeInactive = params.show === "inactive";
  const includeUnverified = params.show === "unverified" || includeInactive;

  const result = await listAllSubjects({
    search: params.search,
    includeInactive,
    includeUnverified,
    limit: 100,
    offset: 0,
  });

  return (
    <SubjectsTable
      initialItems={result.items}
      total={result.total}
      search={params.search ?? ""}
      showFilter={
        (params.show as
          | "active"
          | "all"
          | "inactive"
          | "unverified"
          | undefined) ?? "active"
      }
    />
  );
}
