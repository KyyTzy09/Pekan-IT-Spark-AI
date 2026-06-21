import { notFound, redirect } from "next/navigation";
import { TopicDetailView } from "@/components/student/subjects-view";
import { getSession } from "@/lib/session";
import { getTopicDetail } from "@/server/actions/dashboard";

export const dynamic = "force-dynamic";

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const session = await getSession();
  if (!session?.id || session.role !== "STUDENT") {
    redirect("/auth/login");
  }

  const { topicId } = await params;
  const summary = await getTopicDetail(topicId, session.id);
  if (!summary) notFound();

  return (
    <TopicDetailView
      topic={{
        ...summary.topic,
        totalConcepts: summary.totalConcepts,
        masteredConcepts: summary.masteredConcepts,
        averageMastery: summary.averageMastery,
        concepts: summary.concepts,
      }}
    />
  );
}
