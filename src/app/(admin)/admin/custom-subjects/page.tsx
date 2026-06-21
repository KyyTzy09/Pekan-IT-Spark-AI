import { redirect } from "next/navigation";
import { CustomSubjectsList } from "@/components/admin/custom-subjects-list";
import { getSession } from "@/lib/session";
import {
  type CustomSubjectFilter,
  listCustomSubjects,
} from "@/server/actions/admin";

export const dynamic = "force-dynamic";

type Search = { filter?: string };

const ALLOWED: ReadonlyArray<CustomSubjectFilter> = [
  "pending",
  "verified",
  "rejected",
  "all",
];

export default async function CustomSubjectsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const session = await getSession();
  if (!session?.id) redirect("/auth/login");
  if (session.role !== "ADMIN") redirect("/");

  const params = await searchParams;
  const requested = (params.filter ?? "pending") as CustomSubjectFilter;
  const filter: CustomSubjectFilter = ALLOWED.includes(requested)
    ? requested
    : "pending";

  const result = await listCustomSubjects({ filter, limit: 50, offset: 0 });

  return (
    <CustomSubjectsList
      initialFilter={filter}
      items={result.items}
      total={result.total}
    />
  );
}
