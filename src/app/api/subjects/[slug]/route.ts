import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  const normalized = normalizeSlug(slug);
  const subject = await prisma.subject.findFirst({
    where: { slug: { equals: normalized, mode: "insensitive" } },
  });
  if (!subject) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const summary = await getSubjectDetail(subject.slug, session.id);
  if (!summary) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(summary);
}
