import { redirect } from "next/navigation";
import { ChallengeHistoryView } from "@/components/student/challenge/challenge-history-view";
import { auth } from "@/lib/auth";
import { getChallengeHistory } from "@/server/actions/challenges";

export const dynamic = "force-dynamic";

export default async function ChallengeHistoryPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  if (session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const result = await getChallengeHistory({ limit: 50, offset: 0 });

  return <ChallengeHistoryView initialResult={result} />;
}
