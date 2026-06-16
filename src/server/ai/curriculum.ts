import "server-only";

import { generateText } from "ai";
import { z } from "zod";
import { chatModel } from "@/lib/ai";

const outlineSchema = z.object({
  description: z
    .string()
    .describe("Deskripsi singkat mapel 1-2 kalimat untuk siswa"),
  icon: z
    .string()
    .describe("Satu emoji yang merepresentasikan mapel (contoh: 🎨, ⚽)"),
  color: z
    .string()
    .describe("Warna hex (contoh: #FF6B6B) yang cocok dengan tema mapel"),
  topics: z
    .array(
      z.object({
        name: z.string().describe("Nama topik, max 60 karakter"),
        description: z
          .string()
          .describe("Deskripsi topik 1 kalimat untuk siswa"),
        concepts: z
          .array(
            z.object({
              name: z
                .string()
                .describe("Nama konsep spesifik, max 80 karakter"),
              description: z.string().describe("Penjelasan konsep 1 kalimat"),
            }),
          )
          .min(3)
          .max(6)
          .describe("3-6 konsep inti dalam topik ini"),
      }),
    )
    .min(3)
    .max(6)
    .describe("3-6 topik utama mapel"),
  pretestQuestions: z
    .array(
      z.object({
        topicIndex: z
          .number()
          .int()
          .min(0)
          .describe("Index topik (0-based) yang dirujuk"),
        questionText: z
          .string()
          .describe("Soal pretest lengkap, jelas dan tidak ambigu"),
        options: z
          .array(z.string())
          .length(4)
          .describe("4 pilihan jawaban untuk multiple choice"),
        correctAnswer: z
          .string()
          .describe(
            "Jawaban benar (harus persis sama dengan salah satu options)",
          ),
        explanation: z
          .string()
          .describe("Penjelasan singkat kenapa jawaban itu benar"),
        difficulty: z
          .enum(["EASY", "MEDIUM", "HARD"])
          .describe("Tingkat kesulitan soal"),
      }),
    )
    .min(5)
    .max(8)
    .describe("5-8 soal pretest untuk ukur kemampuan awal siswa"),
});

export type CurriculumOutline = z.infer<typeof outlineSchema>;

export interface CurriculumInput {
  subjectName: string;
  context?: string;
  gradeLevel?: number;
  educationLevel?: "SMA" | "SMK";
}

const SYSTEM_PROMPT = `Kamu adalah perancang kurikulum untuk platform tutor AI Spark Ai (SMA/SMK Indonesia).

Tugasmu: saat siswa menambahkan mata pelajaran CUSTOM (di luar kurikulum nasional resmi), kamu harus:
1. Membuat OUTLINE mapel (3-6 topik, masing-masing 3-6 konsep).
2. Membuat PRETEST 5-8 soal pilihan ganda untuk mengukur kemampuan awal siswa.

ATURAN WAJIB:
- Semua output dalam Bahasa Indonesia.
- Konten edukasi yang aman untuk siswa SMA/SMK.
- Soal pretest harus JELAS, tidak ambigu, dan punya 1 jawaban benar yang pasti.
- correctAnswer HARUS PERSIS sama dengan salah satu string di options (case-sensitive).
- difficulty realistis untuk siswa SMA/SMK yang baru mulai belajar mapel ini.
- Jangan buat soal yang butuh gambar/diagram.
- Topik & konsep harus RELEVAN dengan nama mapel.

PENTING: Outline ini akan dipakai untuk generate soal pretest dan materi belajar personal. Kualitas tinggi = pengalaman belajar yang baik.

Format output harus selalu JSON valid sesuai struktur berikut:
{
  "description": "Deskripsi singkat mapel",
  "icon": "🎨",
  "color": "#HEXWarna",
  "topics": [
    {
      "name": "Nama Topik",
      "description": "Deskripsi singkat topik",
      "concepts": [
        {
          "name": "Nama Konsep",
          "description": "Penjelasan singkat konsep"
        }
      ]
    }
  ],
  "pretestQuestions": [
    {
      "topicIndex": 0,
      "questionText": "Soal lengkap",
      "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
      "correctAnswer": "Opsi yang benar",
      "explanation": "Penjelasan jawaban benar",
      "difficulty": "EASY" | "MEDIUM" | "HARD"
    }
  ]
}`;

function safeParseJson(text: string): unknown {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
      } catch (_e) {}
    }
    throw err;
  }
}

export async function generateCurriculumOutline(
  input: CurriculumInput,
): Promise<CurriculumOutline> {
  const userPrompt = `Buat outline mata pelajaran custom untuk siswa ${
    input.educationLevel ?? "SMA/SMK"
  }${input.gradeLevel ? ` kelas ${input.gradeLevel}` : ""}.

Nama mapel: ${input.subjectName}
${input.context ? `Konteks tambahan dari siswa: ${input.context}` : ""}

Generate outline lengkap sesuai instruksi.`;

  const { text } = await generateText({
    model: chatModel,
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    temperature: 0.4,
  });

  const parsedJson = safeParseJson(text);
  const validated = outlineSchema.parse(parsedJson);
  validateOutline(validated);
  return validated;
}

function validateOutline(outline: CurriculumOutline): void {
  for (const q of outline.pretestQuestions) {
    if (!outline.topics[q.topicIndex]) {
      throw new Error(
        `Outline tidak valid: pretest question merujuk topicIndex ${q.topicIndex} yang tidak ada`,
      );
    }
    if (!q.options.includes(q.correctAnswer)) {
      throw new Error(
        `Outline tidak valid: correctAnswer "${q.correctAnswer}" bukan salah satu dari options [${q.options.join(", ")}]`,
      );
    }
  }
}
