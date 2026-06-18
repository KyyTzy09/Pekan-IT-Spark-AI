import { notFound, redirect } from "next/navigation";
import { SubjectDetailView } from "@/components/student/subjects-view";
import { auth } from "@/lib/auth";
import { getSubjectDetail } from "@/server/actions/dashboard";

export const dynamic = "force-dynamic";

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
  sejarah: "SEJARAH",
  geografi: "GEOGRAFI",
  ekonomi: "EKONOMI",
  sosiologi: "SOSIOLOGI",
  ppkn: "PPKN",
  "seni-budaya": "SENI_BUDAYA",
  pjok: "PJOK",
  prakarya: "PRAKARYA",
  "bahasa-daerah": "BAHASA_DAERAH",
  coding: "CODING",
  custom: "CUSTOM",
};

const OFFICIAL_SLUGS = new Set<string>([
  "MATEMATIKA",
  "BAHASA_INDONESIA",
  "BAHASA_INGGRIS",
  "IPA",
  "SEJARAH",
  "GEOGRAFI",
  "EKONOMI",
  "SOSIOLOGI",
  "PPKN",
  "SENI_BUDAYA",
  "PJOK",
  "PRAKARYA",
  "BAHASA_DAERAH",
  "CODING",
  "CUSTOM",
]);

function normalizeSlug(raw: string): string {
  const key = raw.toLowerCase().trim();
  if (SLUG_MAP[key]) {
    return SLUG_MAP[key];
  }
  const upperCandidate = key.toUpperCase().replace(/-/g, "_");
  if (OFFICIAL_SLUGS.has(upperCandidate)) {
    return upperCandidate;
  }
  return raw.trim();
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
