import "server-only";

import { chatModel, streamText } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import type {
  LearningStyle,
  ResponseDepth,
} from "../../../generated/prisma/client";

interface ConceptMastery {
  id: string;
  name: string;
  status: "NOT_STARTED" | "LEARNING" | "MASTERED" | "STRUGGLING";
  masteryScore: number;
  topicName: string;
  subjectName: string;
}

interface TutorOptions {
  subject?: { id: string; name: string; slug: string };
  topic?: { id: string; name: string };
  learningStyle?: LearningStyle | null;
  responseDepth?: ResponseDepth | null;
  grade?: number | null;
  school?: string | null;
}

function buildSystemPrompt(
  options: TutorOptions,
  mastery: ConceptMastery[],
  contextSnippets: string[],
  userName?: string,
): string {
  const mastered = mastery.filter((c) => c.status === "MASTERED");
  const learning = mastery.filter(
    (c) => c.status === "LEARNING" || c.status === "STRUGGLING",
  );
  const newOnes = mastery.filter((c) => c.status === "NOT_STARTED").slice(0, 5);

  const subjectLine = options.subject
    ? `Mata pelajaran: ${options.subject.name}.`
    : "Topik umum: mata pelajaran SMA/SMK Indonesia.";
  const topicLine = options.topic
    ? `Topik saat ini: ${options.topic.name}.`
    : "";
  const gradeLine = options.grade ? `Kelas siswa: ${options.grade}.` : "";
  const schoolLine = options.school ? `Asal sekolah: ${options.school}.` : "";
  const styleLine = options.learningStyle
    ? `Gaya belajar siswa: ${styleLabel(options.learningStyle)}.`
    : "";

  const responseDepthLine =
    options.responseDepth === "RINGKAS"
      ? "Beri respons ringkas (1–2 kalimat)."
      : options.responseDepth === "LENGKAP"
        ? "Beri respons lengkap dan terstruktur."
        : "Beri respons dengan panjang sedang (2–4 kalimat).";

  return `Kamu adalah Spark, tutor AI pribadi untuk siswa SMA/SMK Indonesia.

## KARAKTER
- Sabar, suportif, tidak menghakimi
- Pakai bahasa Indonesia kasual yang ramah anak muda (pake "kamu", "aku", bukan formal)
- Sesekali kasih semangat dan motivasi yang genuine
- Kalau siswa salah, jangan judge — bantu mereka paham kenapa
- Selalu akhiri respons dengan pertanyaan terbuka untuk lanjutin dialog (kecuali konteksnya sudah clear)

## PROFIL SISWA
${userName ? `Nama: ${userName}` : ""}
${subjectLine}
${topicLine}
${gradeLine}
${schoolLine}
${styleLine}
${responseDepthLine}

## PENDEKATAN MENGAJAR (Socratic Method — INI PENTING)
1. JANGAN PERNAH kasih jawaban final langsung. Kalau siswa minta jawaban PR/ujian, tolak dengan halus dan tawarkan untuk bantu memahami konsepnya.
2. SELALU mulai dengan pertanyaan probing untuk tau apa yang siswa udah tau.
3. Kalau siswa bingung, PECAH konsep jadi bagian kecil. Tanya satu hal pada satu waktu.
4. Kalau siswa salah, JANGAN langsung koreksi. Tanya "Apa yang bikin kamu mikir begitu?" atau "Coba jelasin langkah kamu" untuk gali miskonsepsi.
5. Kalau siswa bener, AKUI usaha mereka sebelum lanjut. ("Nice! Nah, kalo gitu gimana kalo...")
6. SELALU akhiri dengan pertanyaan terbuka untuk lanjutin dialog.

## KONTEKS KURIKULUM
${
  contextSnippets.length > 0
    ? `Berikut materi kurikulum yang relevan:\n${contextSnippets
        .slice(0, 3)
        .map((s, i) => `[${i + 1}] ${s}`)
        .join("\n\n")}`
    : "(Belum ada materi kurikulum yang match — jawab dari pengetahuan umum yang sesuai)."
}

## KONSEP YANG SUDAH DIKUASAI SISWA
${
  mastered.length > 0
    ? mastered.map((c) => `- ${c.name} (${c.subjectName})`).join("\n")
    : "(Belum ada)"
}

## KONSEP YANG LAGI DIPELAJARI / STRUGGLE
${
  learning.length > 0
    ? learning
        .map(
          (c) =>
            `- ${c.name} (${c.subjectName}) — ${c.status} ${Math.round(c.masteryScore * 100)}%`,
        )
        .join("\n")
    : "(Belum ada)"
}

${
  newOnes.length > 0
    ? `## KONSEP YANG BELUM DIMULAI
${newOnes.map((c) => `- ${c.name}`).join("\n")}`
    : ""
}

## ATURAN KERAS (JANGAN DILANGGAR)
- JANGAN kasih jawaban langsung untuk PR/ujian. Bimbing dengan Socratic.
- JANGAN bahas topik di luar edukasi SMA/SMK.
- JANGAN kasih konten berbahaya, menyesatkan, atau tidak sesuai untuk pelajar.
- Kalau siswa tanya hal yang bukan edukasi, tolak dengan halus: "Aku cuma bisa bantu untuk pelajaran sekolah ya."
- Kalau siswa nanya apa kamu AI, jawab jujur: "Iya, aku Spark AI, temen belajar virtual kamu."
- JANGAN claim kamu manusia.
- Pakai bahasa Indonesia. Kalau siswa mix English, boleh aja.

## FORMAT
- Maksimal 3-4 kalimat per respons
- Pake bahasa percakapan, bukan bahasa buku
- Kadang pake emoji untuk feel friendly, tapi jangan berlebihan`;
}

function styleLabel(s: LearningStyle): string {
  switch (s) {
    case "VISUAL":
      return "visual (suka gambar, diagram)";
    case "TEXTUAL":
      return "tekstual (suka bacaan)";
    case "EXAMPLE_HEAVY":
      return "contoh (suka belajar lewat contoh soal)";
    case "SOCRATIC":
      return "Socratic (suka dipandu lewat pertanyaan)";
    default:
      return s;
  }
}

async function loadUserContext(
  userId: string,
  subjectSlug?: string,
  topicId?: string,
) {
  const [profile, concepts] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { userId },
      select: {
        educationLevel: true,
        grade: true,
        school: true,
        learningStyle: true,
        responseDepth: true,
        focusedSubjects: true,
      },
    }),
    prisma.studentKnowledgeProfile.findMany({
      where: { userId },
      include: {
        concept: {
          include: {
            topic: { include: { subject: true } },
          },
        },
      },
      take: 50,
    }),
  ]);

  const subject = subjectSlug
    ? await prisma.subject.findUnique({
        where: { slug: subjectSlug as never },
        select: { id: true, name: true, slug: true },
      })
    : null;
  const topic = topicId
    ? await prisma.topic.findUnique({
        where: { id: topicId },
        select: { id: true, name: true },
      })
    : null;

  const mastery: ConceptMastery[] = concepts
    .filter((c) => c.concept?.topic?.subject)
    .map((c) => ({
      id: c.conceptId,
      name: c.concept.name,
      status: c.status as ConceptMastery["status"],
      masteryScore: c.masteryScore,
      topicName: c.concept.topic.name,
      subjectName: c.concept.topic.subject.name,
    }));

  return {
    profile: profile
      ? {
          grade: profile.grade,
          school: profile.school,
          learningStyle: profile.learningStyle,
          responseDepth: profile.responseDepth,
        }
      : null,
    subject,
    topic,
    mastery,
  };
}

export async function generateTutorStream(input: {
  userId: string;
  userName?: string;
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  subjectSlug?: string;
  topicId?: string;
  lastUserMessage?: string;
}) {
  console.log("[AI_SERVICE] generateTutorStream start", {
    userId: input.userId,
  });
  const ctx = await loadUserContext(
    input.userId,
    input.subjectSlug,
    input.topicId,
  );

  const contextSnippets: string[] = [];

  const systemPrompt = buildSystemPrompt(
    {
      subject: ctx.subject
        ? { id: ctx.subject.id, name: ctx.subject.name, slug: ctx.subject.slug }
        : undefined,
      topic: ctx.topic ?? undefined,
      learningStyle: ctx.profile?.learningStyle ?? null,
      responseDepth: ctx.profile?.responseDepth ?? null,
      grade: ctx.profile?.grade ?? null,
      school: ctx.profile?.school ?? null,
    },
    ctx.mastery,
    contextSnippets,
    input.userName,
  );

  return streamText({
    model: chatModel,
    system: systemPrompt,
    messages: input.messages,
    temperature: 0.7,
  });
}

export async function generateChatTitle(firstMessage: string): Promise<string> {
  const trimmed = firstMessage.trim();
  if (trimmed.length <= 48) return trimmed;
  return `${trimmed.slice(0, 45).trimEnd()}…`;
}
