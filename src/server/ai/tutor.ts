import "server-only";

import { chatModel, streamText } from "@/lib/ai";
import { aiLog, EMOJI } from "@/lib/ai-logger";
import { prisma } from "@/lib/prisma";
import {
  sanitizeNameForPrompt,
  sanitizeForPrompt,
} from "@/lib/prompt-sanitize";
import type {
  LearningStyle,
  ResponseDepth,
} from "../../../generated/prisma/client";
import { retrieveContext } from "./rag";

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
    ? `Mata pelajaran: ${sanitizeForPrompt(options.subject.name)}.`
    : "Topik umum: mata pelajaran SMA/SMK Indonesia.";
  const topicLine = options.topic
    ? `Topik saat ini: ${sanitizeForPrompt(options.topic.name)}.`
    : "";
  const gradeLine = options.grade ? `Kelas siswa: ${options.grade}.` : "";
  const schoolLine = options.school
    ? `Asal sekolah: ${sanitizeForPrompt(options.school)}.`
    : "";
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
${userName ? `Nama: ${sanitizeNameForPrompt(userName)}` : ""}
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
  const [profile, concepts, subject, topic] = await Promise.all([
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
    subjectSlug
      ? prisma.subject.findUnique({
          where: { slug: subjectSlug as never },
          select: { id: true, name: true, slug: true },
        })
      : Promise.resolve(null),
    topicId
      ? prisma.topic.findUnique({
          where: { id: topicId },
          select: { id: true, name: true },
        })
      : Promise.resolve(null),
  ]);

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

const SHORT_MESSAGE_RE =
  /^(halo|hai|hi|hey|ok|oke|okay|sip|ya|iya|yoi|makasih|terima\s*kasih|thx|thanks|good|bagus|nice|woh|wah|oh|ah|hmm|haha|hehe|wkwk|lol|brb|gtg|bye|dadah|see\s*ya|mantap|mantab|asik|asyik|sippp|makasi|makasihh|makasihhh|thankyou|thank\s*you|sip\s*bgt|ok\s*siap|siap|baik|baiklah|noted|understood|mengerti|paham|ngerti|iye|iyh|y|n|yep|nope|nah|lah|dong|dongg|deh|sih|kok|kenapa|apa|gimana|gimana\s*sih|emang|bener|salah|bisa|ga\s*bisa|gabisa|bgt|banget|sekali|sedikit|dikit|lagi|lagi\s*dong|coba|tolong|plis|please|pls)\s*$/i;

function isShortMessage(text: string): boolean {
  return SHORT_MESSAGE_RE.test(text);
}

export async function generateTutorStream(input: {
  userId: string;
  userName?: string;
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  subjectSlug?: string;
  topicId?: string;
  lastUserMessage?: string;
  queryEmbedding?: number[];
  hasDocumentContext?: boolean;
}) {
  aiLog.info(`${EMOJI.start} generateTutorStream — user: ${input.userId}`);
  const ctx = await loadUserContext(
    input.userId,
    input.subjectSlug,
    input.topicId,
  );

  const contextSnippets: string[] = [];
  const query =
    input.lastUserMessage ||
    input.messages.filter((m) => m.role === "user").pop()?.content ||
    "";

  // Skip RAG entirely when document context already provides relevant chunks
  const shouldRunRag =
    !input.hasDocumentContext &&
    query.trim().length >= 15 &&
    !isShortMessage(query.trim());

  if (shouldRunRag) {
    try {
      const retrieved = await retrieveContext({
        userId: input.userId,
        query: query,
        subjectId: ctx.subject?.id,
        topicId: ctx.topic?.id,
        limit: 3,
        queryEmbedding: input.queryEmbedding,
      });
      for (const item of retrieved) {
        contextSnippets.push(
          `[${item.type.toUpperCase()}: ${item.title}]\n${item.content}`,
        );
      }
    } catch (err) {
      aiLog.warn(
        `${EMOJI.warn} RAG context gagal diambil: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  } else if (input.hasDocumentContext) {
    aiLog.info(`${EMOJI.ok} RAG di-skip — dokumen linked, konteks sudah tersedia`);
  } else if (query.trim().length > 0) {
    aiLog.info(`${EMOJI.ok} RAG di-skip — pesan terlalu pendek/greeting`);
  }

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

  // Window messages to fit within model context: keep system prompt + last N conversation turns
  const MAX_TURNS = 10; // 10 user-assistant pairs = 20 messages
  const systemMessages = input.messages.filter((m) => m.role === "system");
  const conversationMessages = input.messages.filter((m) => m.role !== "system");

  let windowedMessages: typeof input.messages;
  if (conversationMessages.length > MAX_TURNS * 2) {
    const keep = conversationMessages.slice(-(MAX_TURNS * 2));
    // Always keep the first user message (it often contains the core question)
    const firstUserIdx = conversationMessages.findIndex((m) => m.role === "user");
    if (firstUserIdx > 0 && !keep.includes(conversationMessages[firstUserIdx])) {
      keep[0] = conversationMessages[firstUserIdx];
    }
    windowedMessages = [...systemMessages, ...keep];
  } else {
    windowedMessages = input.messages;
  }

  return streamText({
    model: chatModel,
    system: systemPrompt,
    messages: windowedMessages,
    temperature: 0.7,
  });
}

export async function generateChatTitle(firstMessage: string): Promise<string> {
  const trimmed = firstMessage.trim();
  if (trimmed.length <= 48) return trimmed;
  return `${trimmed.slice(0, 45).trimEnd()}…`;
}
