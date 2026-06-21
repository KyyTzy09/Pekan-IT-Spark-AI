import { notFound, redirect } from "next/navigation";
import { SubjectEditView } from "@/components/admin/subject-edit-view";
import { getSession } from "@/lib/session";
import { getAdminSubjectDetail } from "@/server/actions/admin-content";

export const dynamic = "force-dynamic";

export default async function AdminSubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.id) redirect("/auth/login");
  if (session.role !== "ADMIN") redirect("/");

  const { id } = await params;
  const subject = await getAdminSubjectDetail(id);
  if (!subject) notFound();

  return <SubjectEditView subject={subject} />;
}
