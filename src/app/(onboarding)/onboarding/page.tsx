import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { OnboardingWizardClient } from "@/components/onboarding/OnboardingWizardClient";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Kenalan dulu — Spark Ai",
  description:
    "Isi profil kamu, pilih mapel fokus, atau bikin mapel kustom pakai AI.",
};

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session?.id) redirect("/auth/login");
  if (session.role !== "STUDENT") redirect("/");

  const subjects = await prisma.subject.findMany({
    where: { isCustom: false },
    orderBy: { order: "asc" },
    select: { id: true, name: true, slug: true, icon: true, color: true },
  });

  return (
    <OnboardingShell>
      <OnboardingWizardClient
        userName={session.name ?? "Teman"}
        subjects={subjects}
      />
    </OnboardingShell>
  );
}
