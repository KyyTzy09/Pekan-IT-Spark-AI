import { notFound, redirect } from "next/navigation";
import { TopicDetailView } from "@/components/admin/topic-detail-view";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminTopicDetailPage({
  params,
}: {
  params: Promise<{ id: string; topicId: string }>;
}) {
  const session = await getSession();
  if (!session?.id) redirect("/auth/login");
  if (session.role !== "ADMIN") redirect("/");

  const { id, topicId } = await params;

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      subject: {
        select: { id: true, name: true, slug: true, color: true, icon: true },
      },
      concepts: {
        orderBy: [{ order: "asc" }, { name: "asc" }],
        include: {
          _count: { select: { questions: true } },
        },
      },
    },
  });

  if (!topic || topic.subjectId !== id) notFound();

  return <TopicDetailView topic={topic} />;
}
