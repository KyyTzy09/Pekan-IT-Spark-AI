import { redirect } from "next/navigation";
import { CustomSubjectsList } from "@/components/admin/custom-subjects-list";
import { auth } from "@/lib/auth";
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
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  if (session.user.role !== "ADMIN") redirect("/");

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
