import "server-only";

import { generateObject, generateText } from "ai";
import { z } from "zod";
import { chatModel } from "@/lib/ai";

export const CHALLENGE_MIX_DEFAULT = {
  questions: 2,
  materials: 1,
  reflections: 1,
} as const;

export type ChallengeMix = {
  questions: number;
  materials: number;
  reflections: number;
};

const materialSchema = z.object({
  title: z
    .string()
    .max(120)
    .describe("Judul materi, singkat dan menarik untuk siswa"),
  content: z
    .string()
    .min(400)
    .max(2500)
    .describe(
      "Konten materi dalam format Markdown. WAJIB ada heading (##), minimal 2 section, dan penutup ringkas. Panjang 400-800 kata.",
    ),
  keyPoints: z
    .array(z.string())
    .min(2)
    .max(5)
    .describe("2-5 poin penting yang harus diingat siswa"),
  estimatedMinutes: z
    .number()
    .int()
    .min(3)
    .max(15)
    .describe("Estimasi waktu baca dalam menit"),
  difficulty: z
    .enum(["EASY", "MEDIUM", "HARD"])
    .describe("Tingkat kesulitan materi"),
});

const reflectionSchema = z.object({
  prompt: z
    .string()
    .min(40)
    .max(300)
    .describe(
      "Prompt refleksi yang terbuka (bukan yes/no), memicu metacognition",
    ),
  context: z
    .string()
    .min(20)
    .max(200)
    .describe("Konteks singkat kenapa refleksi ini relevan"),
});

const challengeItemPlanSchema = z.object({
  kind: z.enum(["QUESTION", "MATERIAL", "REFLECTION"]),
  subjectSlug: z
    .enum([
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
    ])
    .describe("Slug mapel (uppercase enum)"),
  conceptHint: z
    .string()
    .max(80)
    .optional()
    .describe("Hint konsep yang relevan (opsional)"),
  topicHint: z
    .string()
    .max(80)
    .optional()
    .describe("Hint topik yang relevan (opsional)"),
  difficultyHint: z
    .enum(["EASY", "MEDIUM", "HARD"])
    .optional()
    .describe("Hint kesulitan"),
  rationale: z
    .string()
    .max(150)
    .describe("Alasan kenapa item ini dipilih untuk siswa"),
  material: materialSchema.optional().describe("Wajib ada jika kind=MATERIAL"),
  reflection: reflectionSchema
    .optional()
    .describe("Wajib ada jika kind=REFLECTION"),
});

export const dailyMixPlanSchema = z.object({
  title: z
    .string()
    .max(80)
    .describe("Judul paket tantangan hari ini, singkat & menarik"),
  description: z
    .string()
    .max(300)
    .describe("Deskripsi 1-2 kalimat apa yang akan dipelajari hari ini"),
  items: z
    .array(challengeItemPlanSchema)
    .min(2)
    .max(8)
    .describe("Daftar item tantangan (2-8 item)"),
  reasoning: z
    .string()
    .max(300)
    .describe("Alasan komposisi item untuk siswa ini"),
});

export type DailyMixPlan = z.infer<typeof dailyMixPlanSchema>;

export interface DailyMixInput {
  userId: string;
  userName?: string;
  grade?: number | null;
  school?: string | null;
  learningStyle?: "VISUAL" | "TEXTUAL" | "EXAMPLE_HEAVY" | "SOCRATIC" | null;
  focusedSubjects: string[];
  weakConcepts: Array<{
    id: string;
    name: string;
    masteryScore: number;
    subjectName: string;
  }>;
  strongConcepts: Array<{
    id: string;
    name: string;
    masteryScore: number;
    subjectName: string;
  }>;
  recentChallenges: Array<{
    title: string;
    kinds: string[];
  }>;
  availableQuestions: Array<{
    id: string;
    conceptId: string;
    conceptName: string;
    topicName: string;
    subjectSlug: string;
    difficulty: "EASY" | "MEDIUM" | "HARD" | "ADVANCED";
  }>;
  mix?: ChallengeMix;
}

const SYSTEM_PROMPT = `Kamu adalah perancang tantangan harian untuk Spark Ai — platform tutor AI untuk siswa SMA/SMK Indonesia.

Tugasmu: merancang PAKET TANTANGAN HARIAN yang variatif, personal, dan bermanfaat. Setiap paket berisi 2-4 item dari 3 jenis:

1. **QUESTION** (soal latihan) — pilih dari bank soal existing yang tersedia (lihat data). Jangan generate soal baru.
2. **MATERIAL** (materi bacaan markdown) — generate materi pembelajaran yang kontekstual. Markdown dengan heading, section, dan penutup.
3. **REFLECTION** (refleksi terbuka) — prompt yang memicu metacognition, BUKAN pertanyaan yes/no.

ATURAN WAJIB:
- Output dalam Bahasa Indonesia.
- Subjek (subjectSlug) HARUS dari focusedSubjects siswa ATAU subject dari weakConcepts.
- Jika availableQuestions ada, PLAN QUESTION items dengan subjectSlug + conceptHint yang ada di sana (sistem akan pilih soalnya).
- Material markdown WAJIB: ada heading (##), minimal 2 section, 400-800 kata, ada keyPoints, ada penutup. Format: intro → konsep inti → contoh → summary → callout "Coba pikirkan".
- Reflection prompt HARUS terbuka (tidak yes/no) dan memicu siswa berpikir, bukan menjawab fakta.
- Difficulty MATERIAL/REFLECTION: jika siswa lemah di konsep (mastery < 0.4) → EASY/explainer; jika sedang → MEDIUM; jika kuat (mastery > 0.7) → HARD/push further.
- Variasi: kalau kemarin ada MATERIAL tentang Trigonometri, hari ini ganti ke materi berbeda.
- Reasoning: jelaskan kenapa komposisi ini cocok untuk siswa.

JANGAN:
- Generate soal baru (pakai bank soal existing)
- Pakai subjectSlug yang tidak ada di focusedSubjects ATAU weakConcepts siswa
- Buat refleksi yang berupa pertanyaan tertutup (ya/tidak)`;

export async function generateDailyMix(
  input: DailyMixInput,
): Promise<DailyMixPlan> {
  const mix = input.mix ?? CHALLENGE_MIX_DEFAULT;
  const totalItems = mix.questions + mix.materials + mix.reflections;

  const questionCatalog = input.availableQuestions
    .slice(0, 30)
    .map(
      (q) =>
        `- [${q.subjectSlug}] ${q.conceptName} (topik: ${q.topicName}, ${q.difficulty})`,
    )
    .join("\n");

  const weakList = input.weakConcepts
    .slice(0, 8)
    .map(
      (c) =>
        `- ${c.name} (${c.subjectName}) — mastery ${(c.masteryScore * 100).toFixed(0)}%`,
    )
    .join("\n");

  const strongList = input.strongConcepts
    .slice(0, 5)
    .map(
      (c) =>
        `- ${c.name} (${c.subjectName}) — mastery ${(c.masteryScore * 100).toFixed(0)}%`,
    )
    .join("\n");

  const recentTitles = input.recentChallenges
    .slice(0, 5)
    .map((c) => `- ${c.title} (${c.kinds.join(", ")})`)
    .join("\n");

  const userPrompt = `Buat paket tantangan harian untuk siswa:
- Nama: ${input.userName ?? "Siswa"}
- Kelas: ${input.grade ?? "belum diisi"}
- Sekolah: ${input.school ?? "belum diisi"}
- Gaya belajar: ${input.learningStyle ?? "TEXTUAL"}
- Mapel fokus: ${input.focusedSubjects.join(", ") || "(belum ada — pilih dari weak concepts)"}

KONSEP LEMAH (perlu penguatan):
${weakList || "(tidak ada data)"}

KONSEP KUAT (untuk variasi/stretch):
${strongList || "(tidak ada data)"}

TANTANGAN 5 HARI TERAKHIR (variasi, hindari pengulangan):
${recentTitles || "(belum ada history)"}

KOMPOSISI YANG DIMINTA:
- ${mix.questions} soal
- ${mix.materials} materi markdown
- ${mix.reflections} refleksi
Total: ${totalItems} item.

BANK SOAL TERSEDIA (untuk QUESTION):
${questionCatalog || "(tidak ada soal di bank — pakai MATERIAL/REFLECTION saja untuk semua item)"}

Output: judul paket, deskripsi, list items sesuai komposisi, dan reasoning.`;

  const { object } = await generateObject({
    model: chatModel,
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
    schema: dailyMixPlanSchema,
    temperature: 0.7,
  });

  validateMixPlan(object, mix);
  return object;
}

function validateMixPlan(plan: DailyMixPlan, mix: ChallengeMix): void {
  const questions = plan.items.filter((i) => i.kind === "QUESTION").length;
  const materials = plan.items.filter((i) => i.kind === "MATERIAL").length;
  const reflections = plan.items.filter((i) => i.kind === "REFLECTION").length;

  if (
    questions !== mix.questions ||
    materials !== mix.materials ||
    reflections !== mix.reflections
  ) {
    throw new Error(
      `Mix plan mismatch: expected q=${mix.questions} m=${mix.materials} r=${mix.reflections}, got q=${questions} m=${materials} r=${reflections}`,
    );
  }

  for (const item of plan.items) {
    if (item.kind === "MATERIAL" && !item.material) {
      throw new Error(`Item MATERIAL missing material details`);
    }
    if (item.kind === "REFLECTION" && !item.reflection) {
      throw new Error(`Item REFLECTION missing reflection details`);
    }
  }
}

export const ON_DEMAND_LIMIT_PER_DAY = 10;

export interface OnDemandInput {
  userId: string;
  kind: "QUESTION" | "MATERIAL" | "REFLECTION" | "MIX";
  subjectSlug?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  focusedSubjects: string[];
  availableQuestions: Array<{
    id: string;
    conceptId: string;
    conceptName: string;
    topicName: string;
    subjectSlug: string;
    difficulty: "EASY" | "MEDIUM" | "HARD" | "ADVANCED";
  }>;
}

export async function generateOnDemandChallenge(
  input: OnDemandInput,
): Promise<DailyMixPlan> {
  let mix: ChallengeMix;
  if (input.kind === "QUESTION")
    mix = { questions: 1, materials: 0, reflections: 0 };
  else if (input.kind === "MATERIAL")
    mix = { questions: 0, materials: 1, reflections: 0 };
  else if (input.kind === "REFLECTION")
    mix = { questions: 0, materials: 0, reflections: 1 };
  else mix = { questions: 1, materials: 1, reflections: 1 };

  return generateDailyMix({
    userId: input.userId,
    focusedSubjects: input.subjectSlug
      ? [input.subjectSlug]
      : input.focusedSubjects,
    weakConcepts: [],
    strongConcepts: [],
    recentChallenges: [],
    availableQuestions: input.availableQuestions,
    mix,
  });
}

const REFLECTION_ANALYSIS_SCHEMA = z.object({
  sentiment: z
    .enum(["POSITIVE", "NEUTRAL", "NEGATIVE"])
    .describe("Sentimen jawaban: positif/netral/negatif"),
  depth: z.enum(["SURFACE", "MODERATE", "DEEP"]).describe("Kedalaman refleksi"),
  suggestions: z
    .array(z.string())
    .min(1)
    .max(3)
    .describe("1-3 saran actionable untuk siswa (mis. diskusiin sama Spark)"),
});

export type ReflectionAnalysis = z.infer<typeof REFLECTION_ANALYSIS_SCHEMA>;

export async function analyzeReflection(
  prompt: string,
  response: string,
  context?: string,
): Promise<ReflectionAnalysis> {
  const userPrompt = `Prompt refleksi yang diberikan:
"""
${prompt}
"""

${context ? `Konteks:\n${context}\n` : ""}Jawaban siswa:
"""
${response}
"""

Analisis jawaban siswa di atas. Tentukan sentimen (POSITIVE jika siswa semangat, NEGATIVE jika frustrasi/merasa gagal, NEUTRAL selain itu), kedalaman (SURFACE = jawaban singkat generik, MODERATE = ada insight tapi belum dalam, DEEP = menunjukkan refleksi bermakna), dan 1-3 saran actionable untuk siswa.`;

  const { object } = await generateObject({
    model: chatModel,
    system:
      "Kamu adalah analis refleksi siswa. Berikan analisis yang jujur, suportif, dan actionable. Jangan menghakimi jawaban siswa.",
    prompt: userPrompt,
    schema: REFLECTION_ANALYSIS_SCHEMA,
    temperature: 0.3,
  });

  return object;
}

export async function generateReflectionPrompt(args: {
  userName?: string;
  subjectName: string;
  topicName?: string;
  materialTitle?: string;
  recentReflections?: string[];
}): Promise<{ prompt: string; context: string }> {
  const { object } = await generateObject({
    model: chatModel,
    system:
      "Kamu adalah perancang prompt refleksi untuk siswa SMA/SMK. Buat prompt yang terbuka, memicu metacognition, bukan pertanyaan tertutup.",
    prompt: `Buat 1 prompt refleksi untuk siswa ${
      args.userName ?? "SMA/SMK"
    } yang baru saja belajar materi:
- Mapel: ${args.subjectName}
${args.topicName ? `- Topik: ${args.topicName}` : ""}
${args.materialTitle ? `- Materi: ${args.materialTitle}` : ""}

Refleksi sebelumnya (untukhindari pengulangan): ${
      args.recentReflections?.join(" | ") ?? "(belum ada)"
    }

Buat prompt yang:
- Tidak yes/no
- Memicu siswa berpikir, bukan menjawab fakta
- Bisa dijawab 2-4 kalimat`,
    schema: z.object({
      prompt: z
        .string()
        .min(40)
        .max(300)
        .describe("Prompt refleksi yang terbuka"),
      context: z
        .string()
        .min(20)
        .max(200)
        .describe("Konteks kenapa refleksi ini relevan"),
    }),
    temperature: 0.6,
  });

  return object;
}

export async function generateMaterialMarkdown(args: {
  userName?: string;
  subjectName: string;
  topicName: string;
  conceptName: string;
  masteryScore: number;
  learningStyle?: string;
}): Promise<{
  title: string;
  content: string;
  keyPoints: string[];
  estimatedMinutes: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
}> {
  const difficulty =
    args.masteryScore < 0.4
      ? "EASY"
      : args.masteryScore > 0.7
        ? "HARD"
        : "MEDIUM";

  const styleNote =
    args.learningStyle === "VISUAL"
      ? "Gunakan analogi visual dan deskripsi imajinatif."
      : args.learningStyle === "EXAMPLE_HEAVY"
        ? "Siswa suka contoh konkret — berikan 2-3 contoh relatable."
        : args.learningStyle === "SOCRATIC"
          ? "Masukkan 1-2 pertanyaan pemandu yang memancing思考."
          : "Gaya bahasa kasual dan suportif, sesuai persona Spark.";

  const result = await generateText({
    model: chatModel,
    system: `Kamu adalah Spark — tutor AI yang sabar dan suportif untuk siswa SMA/SMK Indonesia.

Buat materi bacaan dalam format Markdown. Struktur WAJIB:
- Heading ## untuk judul
- Intro 1 paragraf (kaitkan dengan kehidupan siswa / apa yang akan dipelajari)
- Minimal 2 section dengan subheading (###)
- Contoh konkret (kalau relevan)
- Summary / penutup singkat
- Callout "💭 Coba pikirkan: <pertanyaan>"

${styleNote}

Difficulty: ${difficulty}. ${
      difficulty === "EASY"
        ? "Bahasa sederhana, analogi kehidupan sehari-hari, definisi dulu baru contoh."
        : difficulty === "HARD"
          ? "Lebih dalam, bisa pakai terminologi advanced, dorong berpikir analitis."
          : "Seimbang, definisi + contoh + sedikit insight."
    }

Panjang: 400-800 kata. Output HANYA markdown, jangan ada penjelasan meta.`,
    prompt: `Mapel: ${args.subjectName}
Topik: ${args.topicName}
Konsep: ${args.conceptName}
Tingkat pemahaman siswa saat ini: ${(args.masteryScore * 100).toFixed(0)}%

Buat materi bacaan yang membantu siswa memahami konsep "${args.conceptName}" lebih dalam. Materi akan disimpan permanen untuk diulang baca, jadi pastikan self-contained.`,
    temperature: 0.6,
  });

  const keyPoints = await extractKeyPoints(result.text);

  return {
    title: `${args.conceptName} — Panduan Singkat`,
    content: result.text,
    keyPoints,
    estimatedMinutes: Math.max(
      3,
      Math.min(10, Math.ceil(args.conceptName.length / 20)),
    ),
    difficulty,
  };
}

async function extractKeyPoints(content: string): Promise<string[]> {
  const lines = content.split("\n").filter((l) => l.trim().length > 0);
  const keyPoints: string[] = [];
  for (const line of lines) {
    const cleaned = line
      .replace(/^#+\s*/, "")
      .replace(/^\*\*|\*\*$/g, "")
      .trim();
    if (
      cleaned.length > 20 &&
      cleaned.length < 150 &&
      !cleaned.startsWith("Coba pikirkan") &&
      !keyPoints.includes(cleaned)
    ) {
      keyPoints.push(cleaned);
      if (keyPoints.length >= 5) break;
    }
  }
  return keyPoints.length > 0
    ? keyPoints
    : ["Poin utama konsep ini", "Aplikasi dalam kehidupan sehari-hari"];
}
