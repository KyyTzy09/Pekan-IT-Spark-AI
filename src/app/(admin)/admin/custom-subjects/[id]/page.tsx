import { notFound, redirect } from "next/navigation";
import { CustomSubjectDetailView } from "@/components/admin/custom-subject-detail-view";
import { auth } from "@/lib/auth";
import { getCustomSubjectDetail } from "@/server/actions/admin";

export const dynamic = "force-dynamic";

export default async function CustomSubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const { id } = await params;
  const subject = await getCustomSubjectDetail(id);
  if (!subject) notFound();

  return <CustomSubjectDetailView subject={subject} />;
}
