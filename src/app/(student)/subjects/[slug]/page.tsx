import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SubjectDetailView } from "@/components/student/subjects-view";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSubjectDetail } from "@/server/actions/dashboard";

const SLUG_MAP: Record<string, string> = {
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

function normalizeSlug(raw: string): string {
  const key = raw.toLowerCase().trim();
  return SLUG_MAP[key] ?? raw.toUpperCase();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug} — Spark Ai`,
    description: `Topik, konsep, dan konstelasi untuk mata pelajaran ${slug}.`,
  };
}

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  const { slug } = await params;
  const normalized = normalizeSlug(slug);
  const subject = await prisma.subject.findUnique({
    where: { slug: normalized as "MATEMATIKA" },
  });
  if (!subject) notFound();

  const summary = await getSubjectDetail(
    subject.slug.toLowerCase(),
    session!.user!.id,
  );
  if (!summary) notFound();
  return <SubjectDetailView summary={summary} />;
}
