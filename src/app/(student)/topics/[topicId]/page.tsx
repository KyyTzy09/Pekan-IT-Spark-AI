import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TopicDetailView } from "@/components/student/subjects-view";
import { auth } from "@/lib/auth";
import { getTopicDetail } from "@/server/actions/dashboard";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Topik — Spark Ai",
    description: "Konstelasi konsep dan skill tree.",
  };
}

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const session = await auth();
  const { topicId } = await params;
  const summary = await getTopicDetail(topicId, session!.user!.id);
  if (!summary) notFound();

  return (
    <TopicDetailView
      topic={{
        id: summary.topic.id,
        name: summary.topic.name,
        slug: summary.topic.slug,
        description: summary.topic.description,
        subjectName: summary.topic.subjectName,
        subjectSlug: summary.topic.subjectSlug.toLowerCase(),
        subjectColor: summary.topic.subjectColor,
        subjectIcon: summary.topic.subjectIcon,
        totalConcepts: summary.totalConcepts,
        masteredConcepts: summary.masteredConcepts,
        averageMastery: summary.averageMastery,
        concepts: summary.concepts,
      }}
    />
  );
}
