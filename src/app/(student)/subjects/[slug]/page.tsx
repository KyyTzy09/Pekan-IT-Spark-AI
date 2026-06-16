import { notFound, redirect } from "next/navigation";
import { SubjectDetailView } from "@/components/student/subjects-view";
import { auth } from "@/lib/auth";
import { getSubjectDetail } from "@/server/actions/dashboard";
import type { SubjectSlug } from "../../../../../generated/prisma/client";

export const dynamic = "force-dynamic";

const SLUG_MAP: Record<string, SubjectSlug> = {
  matematika: "MATEMATIKA",
  bahasa: "BAHASA_INDONESIA",
  "bahasa-indonesia": "BAHASA_INDONESIA",
  "b-indonesia": "BAHASA_INDONESIA",
  inggris: "BAHASA_INGGRIS",
  "bahasa-inggris": "BAHASA_INGGRIS",
  "b-inggris": "BAHASA_INGGRIS",
  ipa: "IPA",
  sains: "IPA",
};

function normalizeSlug(raw: string): SubjectSlug {
  const key = raw.toLowerCase().trim();
  return (SLUG_MAP[key] ?? raw.toUpperCase()) as SubjectSlug;
}

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    redirect("/auth/login");
  }

  const { slug } = await params;
  const normalized = normalizeSlug(slug);

  const summary = await getSubjectDetail(normalized, session.user.id);
  if (!summary) notFound();

  return <SubjectDetailView summary={summary} />;
}
