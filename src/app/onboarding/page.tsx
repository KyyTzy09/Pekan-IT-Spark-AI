import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingFlow } from "./onboarding-flow";

export const metadata: Metadata = {
  title: "Yuk, Kenalan Dulu — Spark Ai",
  description:
    "Biar Spark bisa nemenin kamu belajar dengan pas, isi beberapa hal ini dulu, ya.",
};

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  if (session.user.isOnboarded) {
    redirect("/dashboard");
  }

  const subjects = await prisma.subject.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
      color: true,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  });

  return (
    <OnboardingFlow
      userName={user?.name ?? "Teman"}
      subjects={subjects.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        icon: s.icon,
        color: s.color,
      }))}
    />
  );
}
