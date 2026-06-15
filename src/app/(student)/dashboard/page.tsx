import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardView } from "@/components/student/dashboard-view";
import { auth } from "@/lib/auth";
import { getDashboardSummary } from "@/server/actions/dashboard";

export const metadata: Metadata = {
  title: "Beranda — Spark Ai",
  description:
    "Sapaan personal dari Spark, progress belajar, dan misi harian kamu.",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  if (session.user.role !== "STUDENT") {
    redirect("/");
  }

  const summary = await getDashboardSummary(session.user.id);
  return <DashboardView summary={summary} />;
}
