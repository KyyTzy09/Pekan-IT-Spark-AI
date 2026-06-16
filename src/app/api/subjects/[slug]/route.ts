import { NextResponse } from "next/server";
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  const normalized = normalizeSlug(slug);
  const subject = await prisma.subject.findUnique({
    where: { slug: normalized as "MATEMATIKA" },
  });
  if (!subject) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const summary = await getSubjectDetail(subject.slug, session.user.id);
  if (!summary) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(summary);
}
