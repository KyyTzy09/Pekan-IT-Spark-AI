import { notFound, redirect } from "next/navigation";
import { ChallengeDetailView } from "@/components/student/challenge/challenge-detail-view";
import { auth } from "@/lib/auth";
import {
  completeChallengeItem,
  getChallengeDetail,
  markMaterialRead,
  submitReflection,
} from "@/server/actions/challenges";

export const dynamic = "force-dynamic";

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  if (session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const detail = await getChallengeDetail(id);
  if (!detail) notFound();

  async function handleCompleteItem(itemId: string, answer?: string) {
    "use server";
    return completeChallengeItem({ itemId, answer });
  }

  async function handleMarkMaterialRead(
    materialId: string,
    readSeconds: number,
    completed: boolean,
  ) {
    "use server";
    return markMaterialRead({ materialId, readSeconds, completed });
  }

  async function handleSubmitReflection(challengeId: string, response: string) {
    "use server";
    return submitReflection({ challengeId, response });
  }

  return (
    <ChallengeDetailView
      challenge={detail}
      onCompleteItem={handleCompleteItem}
      onMarkMaterialRead={handleMarkMaterialRead}
      onSubmitReflection={handleSubmitReflection}
    />
  );
}
