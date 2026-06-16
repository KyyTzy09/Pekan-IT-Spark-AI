import { notFound, redirect } from "next/navigation";
import { SubjectEditView } from "@/components/admin/subject-edit-view";
import { auth } from "@/lib/auth";
import { getAdminSubjectDetail } from "@/server/actions/admin-content";

export const dynamic = "force-dynamic";

export default async function AdminSubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const { id } = await params;
  const subject = await getAdminSubjectDetail(id);
  if (!subject) notFound();

  return <SubjectEditView subject={subject} />;
}
