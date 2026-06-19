import "server-only";

import { z } from "zod";
import { chatModel, generateText } from "@/lib/ai";

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
  } catch {
    const firstBrace = cleaned.indexOf("{");
    if (firstBrace === -1) {
      throw new Error(
        `Failed to parse JSON from AI response (no JSON object found): ${text.slice(0, 200)}...`,
      );
    }
    // Find matching closing brace using depth counting
    let depth = 0;
    let end = -1;
    for (let i = firstBrace; i < cleaned.length; i++) {
      if (cleaned[i] === "{") depth++;
      if (cleaned[i] === "}") depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
    if (end <= firstBrace) {
      throw new Error(
        `Failed to parse JSON from AI response (unbalanced braces): ${text.slice(0, 200)}...`,
      );
    }
    try {
      return JSON.parse(cleaned.slice(firstBrace, end + 1));
    } catch {
      throw new Error(
        `Failed to parse JSON from AI response (invalid JSON after extraction): ${text.slice(0, 200)}...`,
      );
    }
  }
}

export function computeDifficultyDistribution(
  masteryScore: number,
  totalCount: number,
): { easy: number; medium: number; hard: number } {
  let easyRatio: number;
  let mediumRatio: number;
  let hardRatio: number;

  if (masteryScore < 0.4) {
    easyRatio = 0.6;
    mediumRatio = 0.3;
    hardRatio = 0.1;
  } else if (masteryScore < 0.7) {
    easyRatio = 0.2;
    mediumRatio = 0.5;
    hardRatio = 0.3;
  } else {
    easyRatio = 0.1;
    mediumRatio = 0.3;
    hardRatio = 0.6;
  }

  const easy = Math.max(1, Math.ceil(totalCount * easyRatio));
  const medium = Math.max(1, Math.ceil(totalCount * mediumRatio));
  const hard = totalCount - easy - medium;

  if (hard < 1) {
    return { easy: easy - 1, medium, hard: 1 };
  }

  return { easy, medium, hard };
}

export async function generateCurriculumOutline(
  input: CurriculumInput,
): Promise<CurriculumOutline> {
  console.log("[AI_SERVICE] generateCurriculumOutline start", {
    subjectName: input.subjectName,
  });
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

export interface TopicConceptsInput {
  topicName: string;
  topicDescription: string;
  concepts: Array<{ name: string; description: string }>;
  learningStyle?: "VISUAL" | "TEXTUAL" | "EXAMPLE_HEAVY" | "SOCRATIC" | null;
}

const CONCEPTS_SYSTEM_PROMPT_BASE = `Kamu adalah pakar edukasi dan pembuat konten pembelajaran untuk platform tutor AI Spark Ai.
Tugasmu adalah membuat materi belajar Markdown mendalam dan soal latihan pilihan ganda untuk konsep-konsep di bawah suatu topik.

ATURAN WAJIB:
1. Materi belajar (contentMd) harus mendalam, komprehensif, memiliki 2-3 paragraf format Markdown yang bersih, menyertakan contoh konkret/analogi sehari-hari, dan bahasa yang asyik bagi siswa SMA/SMK Indonesia.
2. Setiap konsep HARUS dibuatkan tepat 3 soal latihan pilihan ganda (1 EASY, 1 MEDIUM, 1 HARD).
3. Soal harus memiliki 4 opsi jawaban, dan correctAnswer HARUS persis sama dengan salah satu opsi (case-sensitive).
4. Berikan explanation (penjelasan jawaban) yang jelas dan edukatif.
5. Berikan hint (petunjuk) berupa pertanyaan panduan/Sokratik singkat yang memicu pemikiran siswa (bukan langsung membocorkan jawaban).
6. Format output HARUS selalu JSON valid sesuai dengan struktur yang diminta.`;

function getStyleInstructions(learningStyle?: string | null): string {
  switch (learningStyle) {
    case "VISUAL":
      return `
7. Gaya belajar VISUAL: Wajib sertakan visualisasi konsep menggunakan diagram alir atau peta konsep dengan sintaks Mermaid.js (misal: \`\`\`mermaid\ngraph TD\n...\n\`\`\`). Gunakan analogi visual yang kuat. Materi harus kaya akan representasi visual.`;
    case "EXAMPLE_HEAVY":
      return `
7. Gaya belajar EXAMPLE_HEAVY: Struktur materi wajib dimulai dengan Studi Kasus nyata atau contoh soal konkret, diikuti bedah solusi langkah-demi-langkah (Step-by-Step Walkthrough). Fokus pada contoh praktis.`;
    case "SOCRATIC":
      return `
7. Gaya belajar SOCRATIC: Sajikan materi dalam bentuk dialog tanya-jawab interaktif antara "Siswa" dan "Spark" untuk memandu siswa menemukan konsepnya secara mandiri. Gunakan pertanyaan pemantik.`;
    case "TEXTUAL":
      return `
7. Gaya belajar TEXTUAL: Berikan penjelasan akademis terstruktur yang mendalam dengan glosarium istilah dan referensi teori formal. Materi harus runtut dan komprehensif.`;
    default:
      return "";
  }
}

export async function generateTopicConceptsContent(
  input: TopicConceptsInput,
): Promise<any> {
  console.log("[AI_SERVICE] generateTopicConceptsContent start", {
    topicName: input.topicName,
    learningStyle: input.learningStyle,
  });

  const styleInstructions = getStyleInstructions(input.learningStyle);
  const systemPrompt = CONCEPTS_SYSTEM_PROMPT_BASE + styleInstructions;

  const userPrompt = `Buat materi belajar dan soal latihan untuk konsep-konsep di dalam topik berikut:
Topik: ${input.topicName}
Deskripsi Topik: ${input.topicDescription}
${input.learningStyle ? `Gaya belajar siswa: ${input.learningStyle}` : ""}

Konsep yang harus dibuatkan kontennya:
${input.concepts.map((c, i) => `${i + 1}. ${c.name} (${c.description})`).join("\n")}

Format output JSON harus persis seperti ini:
{
  "concepts": [
    {
      "conceptName": "Nama Konsep",
      "contentMd": "Materi belajar lengkap Markdown...",
      "questions": [
        {
          "questionText": "Soal...",
          "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
          "correctAnswer": "Opsi yang benar",
          "explanation": "Penjelasan...",
          "hint": "Petunjuk...",
          "difficulty": "EASY" | "MEDIUM" | "HARD"
        }
      ]
    }
  ]
}`;

  const { text } = await generateText({
    model: chatModel,
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.5,
  });

  return safeParseJson(text);
}
