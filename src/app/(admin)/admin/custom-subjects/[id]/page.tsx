import { notFound, redirect } from "next/navigation";
import { CustomSubjectDetailView } from "@/components/admin/custom-subject-detail-view";
import { getSession } from "@/lib/session";
import { getCustomSubjectDetail } from "@/server/actions/admin";

export const dynamic = "force-dynamic";

export default async function CustomSubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.id) redirect("/auth/login");
  if (session.role !== "ADMIN") redirect("/");

  const { id } = await params;
  const subject = await getCustomSubjectDetail(id);
  if (!subject) notFound();

  return <CustomSubjectDetailView subject={subject} />;
}
