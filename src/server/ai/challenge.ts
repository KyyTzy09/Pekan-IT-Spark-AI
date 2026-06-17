import "server-only";

import { z } from "zod";
import { chatModel, generateText } from "@/lib/ai";
import type { SubjectSlug } from "../../../generated/prisma/client";

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
    .max(6000)
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
    .max(500)
    .describe(
      "Prompt refleksi yang terbuka (bukan yes/no), memicu metacognition",
    ),
  context: z
    .string()
    .min(20)
    .max(300)
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
    .max(300)
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
    .max(12)
    .describe("Daftar item tantangan (2-8 item)"),
  reasoning: z
    .string()
    .max(3000)
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

Tugasmu: merancang PAKET TANTANGAN HARIAN yang variatif, personal, dan bermanfaat. Setiap paket berisi item tantangan dengan jumlah yang disesuaikan dengan profil adaptif siswa (antara 4 sampai 8 item) dari 3 jenis:

1. **QUESTION** (soal latihan) — pilih dari bank soal existing yang tersedia (lihat data). Jangan generate soal baru.
2. **MATERIAL** (materi bacaan markdown) — generate materi pembelajaran yang kontekstual. Markdown dengan heading, section, dan penutup.
3. **REFLECTION** (refleksi terbuka) — prompt yang memicu metacognition, BUKAN pertanyaan yes/no.

ATURAN WAJIB:
- Output dalam Bahasa Indonesia.
- Subjek (subjectSlug) HARUS dari focusedSubjects siswa ATAU subject dari weakConcepts. Gunakan enum subjectSlug uppercase yang tepat: "MATEMATIKA", "BAHASA_INDONESIA", "BAHASA_INGGRIS", "IPA", "SEJARAH", "GEOGRAFI", "EKONOMI", "SOSIOLOGI", "PPKN", "SENI_BUDAYA", "PJOK", "PRAKARYA", "BAHASA_DAERAH", "CODING", "CUSTOM". Jangan disingkat (misal jangan pakai "MAT" atau "BID").
- Jika availableQuestions ada, PLAN QUESTION items dengan subjectSlug + conceptHint yang ada di sana (sistem akan pilih soalnya).
- Material markdown WAJIB: ada heading (##), minimal 2 section, 400-800 kata, ada keyPoints, ada penutup. Format: intro → konsep inti → contoh → summary → callout "Coba pikirkan".
- Reflection prompt HARUS terbuka (tidak yes/no) dan memicu siswa berpikir, bukan menjawab fakta.
- Difficulty MATERIAL/REFLECTION: jika siswa lemah di konsep (mastery < 0.4) → EASY/explainer; jika sedang → MEDIUM; jika kuat (mastery > 0.7) → HARD/push further.
- Sesuaikan gaya penulisan MATERIAL dengan gaya belajar siswa (learningStyle):
  * VISUAL: gunakan analogi visual, deskripsi imajinatif visual, dan format yang mudah dicerna secara spasial.
  * EXAMPLE_HEAVY: sertakan banyak contoh konkret, studi kasus nyata, dan soal-soal aplikatif yang relevan untuk usia SMA/SMK.
  * SOCRATIC: gunakan pertanyaan-pertanyaan pemandu kritis di awal dan akhir sub-bab untuk memicu rasa ingin tahu.
  * TEXTUAL: berikan penjelasan teoretis yang runtut, terstruktur, mendalam, dan kaya referensi.
- Sesuaikan kedalaman dan kompleksitas materi dengan jenjang kelas (grade) siswa agar menantang namun dapat dipahami.
- Variasi: kalau kemarin ada MATERIAL tentang Trigonometri, hari ini ganti ke materi berbeda.
- Reasoning: jelaskan kenapa komposisi ini cocok untuk siswa.

JANGAN:
- Generate soal baru (pakai bank soal existing)
- Pakai subjectSlug yang tidak ada di focusedSubjects ATAU weakConcepts siswa
- Buat refleksi yang berupa pertanyaan tertutup (ya/tidak)
- Membungkus output JSON dengan key luar seperti "challengePackage". Output harus langsung berupa object JSON sesuai schema.
- Menuliskan teks obrolan, penjelasan, basa-basi, atau kalimat pengantar di luar JSON. Output Anda HARUS berupa string JSON valid saja.
- Menggunakan karakter baris baru asli di dalam nilai string JSON. Semua baris baru dalam teks markdown materi ("content") harus di-escape menjadi '\\n' literal.

Format JSON yang wajib diikuti:
{
  "title": "Judul paket",
  "description": "Deskripsi singkat",
  "items": [
    {
      "kind": "QUESTION",
      "subjectSlug": "MATEMATIKA" | "BAHASA_INDONESIA" | ...,
      "conceptHint": "Nama konsep",
      "difficultyHint": "EASY" | "MEDIUM" | "HARD",
      "rationale": "Kenapa ini dipilih"
    },
    {
      "kind": "MATERIAL",
      "subjectSlug": "MATEMATIKA" | "BAHASA_INDONESIA" | ...,
      "conceptHint": "Nama konsep",
      "difficultyHint": "EASY" | "MEDIUM" | "HARD",
      "rationale": "Kenapa ini dipilih",
      "material": {
        "title": "Judul materi",
        "content": "Isi materi markdown lengkap minimal 400 kata...",
        "keyPoints": ["poin 1", "poin 2"],
        "estimatedMinutes": 5,
        "difficulty": "EASY" | "MEDIUM" | "HARD"
      }
    },
    {
      "kind": "REFLECTION",
      "subjectSlug": "MATEMATIKA" | "BAHASA_INDONESIA" | ...,
      "conceptHint": "Nama konsep",
      "difficultyHint": "EASY" | "MEDIUM" | "HARD",
      "rationale": "Kenapa ini dipilih",
      "reflection": {
        "prompt": "Pertanyaan refleksi terbuka",
        "context": "Konteks refleksi"
      }
    }
  ],
  "reasoning": "Alasan komposisi"
}`;

function sanitizeJsonString(raw: string): string {
  let inString = false;
  let escaped = false;
  let result = "";
  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if (char === '"' && !escaped) {
      inString = !inString;
    }
    if (inString && (char === "\n" || char === "\r")) {
      result += "\\n";
    } else {
      result += char;
    }
    if (char === "\\" && !escaped) {
      escaped = true;
    } else {
      escaped = false;
    }
  }
  return result;
}

function safeParseJson(text: string): unknown {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const jsonCandidate = text.slice(firstBrace, lastBrace + 1).trim();
    const sanitized = sanitizeJsonString(jsonCandidate);
    try {
      return JSON.parse(sanitized);
    } catch (err) {
      console.warn(
        "safeParseJson failed to parse candidate:",
        err,
        "Sanitized candidate was:",
        sanitized.slice(0, 300),
      );
      throw new Error(
        `JSON parsing failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  const sanitizedClean = sanitizeJsonString(text.trim());
  return JSON.parse(sanitizedClean);
}

export async function generateDailyMix(
  input: DailyMixInput,
): Promise<DailyMixPlan> {
  console.log("[AI_SERVICE] generateDailyMix start", {
    userId: input.userId,
  });
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

  try {
    console.log("[AI_SERVICE] generateDailyMix request", {
      model: chatModel,
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
    });
    const { text } = await generateText({
      model: chatModel,
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.7,
    });
    console.log("[AI_SERVICE] generateDailyMix response", { text });

    const rawJson = safeParseJson(text);
    const mapped = await tryMapAndRecoverMixPlan(rawJson, input);
    if (!mapped) {
      throw new Error("Failed to parse daily mix plan from AI output");
    }
    const parsed = dailyMixPlanSchema.parse(mapped);
    validateMixPlan(parsed, mix);
    return parsed;
  } catch (err: unknown) {
    console.warn("generateDailyMix failed. Error:", err);
    throw err;
  }
}

function normalizeSubjectSlug(slug: string): string {
  const s = slug.toUpperCase().trim();
  if (s === "MAT" || s === "MATEMATIKA") return "MATEMATIKA";
  if (s === "BID" || s === "BAHASA_INDONESIA" || s === "INDONESIA")
    return "BAHASA_INDONESIA";
  if (s === "ING" || s === "BAHASA_INGGRIS" || s === "INGGRIS")
    return "BAHASA_INGGRIS";
  if (s === "IPA") return "IPA";
  if (s === "SEJ" || s === "SEJARAH") return "SEJARAH";
  if (s === "GEO" || s === "GEOGRAFI") return "GEOGRAFI";
  if (s === "EKO" || s === "EKONOMI") return "EKONOMI";
  if (s === "SOS" || s === "SOSIOLOGI") return "SOSIOLOGI";
  if (s === "PPK" || s === "PPKN") return "PPKN";
  if (s === "SEN" || s === "SENI" || s === "SENI_BUDAYA") return "SENI_BUDAYA";
  if (s === "PJO" || s === "PJOK") return "PJOK";
  if (s === "PRA" || s === "PRAKARYA") return "PRAKARYA";
  if (s === "DAE" || s === "BAHASA_DAERAH" || s === "DAERAH")
    return "BAHASA_DAERAH";
  if (s === "COD" || s === "CODING") return "CODING";
  if (s === "CUS" || s === "CUSTOM") return "CUSTOM";
  return s;
}

function getSubjectNameFromSlug(slug: string): string {
  const normalized = normalizeSubjectSlug(slug);
  switch (normalized) {
    case "MATEMATIKA":
      return "Matematika";
    case "BAHASA_INDONESIA":
      return "Bahasa Indonesia";
    case "BAHASA_INGGRIS":
      return "Bahasa Inggris";
    case "IPA":
      return "Ilmu Pengetahuan Alam";
    case "SEJARAH":
      return "Sejarah";
    case "GEOGRAFI":
      return "Geografi";
    case "EKONOMI":
      return "Ekonomi";
    case "SOSIOLOGI":
      return "Sosiologi";
    case "PPKN":
      return "PPKN";
    case "SENI_BUDAYA":
      return "Seni Budaya";
    case "PJOK":
      return "PJOK";
    case "PRAKARYA":
      return "Prakarya";
    case "BAHASA_DAERAH":
      return "Bahasa Daerah";
    case "CODING":
      return "Coding";
    default:
      return normalized;
  }
}

async function tryMapAndRecoverMixPlan(
  rawJson: unknown,
  input: DailyMixInput,
): Promise<DailyMixPlan | null> {
  if (!rawJson || typeof rawJson !== "object") return null;

  const rawObj = rawJson as Record<string, unknown>;
  let root = rawObj;
  if (rawObj.challengePackage && typeof rawObj.challengePackage === "object") {
    root = rawObj.challengePackage as Record<string, unknown>;
  }

  const title =
    typeof root.title === "string"
      ? root.title.slice(0, 80)
      : "Tantangan Harian";
  const description =
    typeof root.description === "string"
      ? root.description.slice(0, 300)
      : "Mari selesaikan tantangan hari ini.";
  const reasoning =
    typeof root.reasoning === "string"
      ? root.reasoning.slice(0, 2500)
      : "Disesuaikan dengan profil belajar siswa.";

  if (!Array.isArray(root.items)) {
    return null;
  }

  const parsedQuestions: DailyMixPlan["items"] = [];
  const parsedMaterials: DailyMixPlan["items"] = [];
  const parsedReflections: DailyMixPlan["items"] = [];

  for (const rawItem of root.items) {
    if (!rawItem || typeof rawItem !== "object") continue;

    const item = rawItem as Record<string, unknown>;

    const kindInput = (item.kind || item.type) as string | undefined;
    let kind: "QUESTION" | "MATERIAL" | "REFLECTION";
    if (
      kindInput === "QUESTION" ||
      kindInput === "MATERIAL" ||
      kindInput === "REFLECTION"
    ) {
      kind = kindInput;
    } else {
      kind = "QUESTION"; // fallback
    }

    let subjectSlug = item.subjectSlug as string | undefined;
    if (typeof subjectSlug === "string") {
      subjectSlug = normalizeSubjectSlug(subjectSlug);
    } else {
      subjectSlug = "MATEMATIKA";
    }

    const difficultyHintInput = (item.difficultyHint || item.difficulty) as
      | string
      | undefined;
    let difficultyHint: "EASY" | "MEDIUM" | "HARD" = "EASY";
    if (
      difficultyHintInput === "EASY" ||
      difficultyHintInput === "MEDIUM" ||
      difficultyHintInput === "HARD"
    ) {
      difficultyHint = difficultyHintInput;
    }

    const rationale =
      (typeof item.rationale === "string" ? item.rationale : null) ||
      (typeof item.description === "string" ? item.description : null) ||
      "Latihan harian untuk topik ini.";

    const mappedItem: DailyMixPlan["items"][number] = {
      kind,
      subjectSlug: subjectSlug as DailyMixPlan["items"][number]["subjectSlug"],
      conceptHint:
        typeof item.conceptHint === "string" ? item.conceptHint : undefined,
      topicHint:
        typeof item.topicHint === "string" ? item.topicHint : undefined,
      difficultyHint,
      rationale,
    };

    if (item.material && typeof item.material === "object") {
      mappedItem.material =
        item.material as DailyMixPlan["items"][number]["material"];
    }
    if (item.reflection && typeof item.reflection === "object") {
      mappedItem.reflection =
        item.reflection as DailyMixPlan["items"][number]["reflection"];
    }

    // Recover missing nested details
    if (mappedItem.kind === "MATERIAL" && !mappedItem.material) {
      const conceptName = mappedItem.conceptHint || "Materi Belajar";
      const subjectName = getSubjectNameFromSlug(mappedItem.subjectSlug);
      const matchedWeak = input.weakConcepts.find(
        (c) =>
          c.name.toLowerCase() === conceptName.toLowerCase() ||
          c.subjectName === subjectName,
      );
      const masteryScore = matchedWeak ? matchedWeak.masteryScore : 0.5;

      try {
        const generatedMaterial = await generateMaterialMarkdown({
          userName: input.userName,
          subjectName,
          topicName: mappedItem.topicHint || conceptName,
          conceptName,
          masteryScore,
          learningStyle: input.learningStyle || undefined,
        });
        mappedItem.material = generatedMaterial;
      } catch (genErr) {
        console.error("Failed to generate fallback material:", genErr);
        mappedItem.material = {
          title: `${conceptName} — Panduan Singkat`,
          content: `## ${conceptName}\n\nMari pelajari konsep ${conceptName} ini. Konsep ini sangat penting untuk memahami dasar subjek ${subjectName}.\n\n### Pengantar\n${rationale}\n\n💭 Coba pikirkan: Bagaimana menerapkan konsep ini dalam kehidupan sehari-hari?`,
          keyPoints: ["Memahami definisi dasar", "Menerapkan contoh soal"],
          estimatedMinutes: 5,
          difficulty: mappedItem.difficultyHint || "EASY",
        };
      }
    }

    if (mappedItem.kind === "REFLECTION" && !mappedItem.reflection) {
      const conceptName = mappedItem.conceptHint || "Refleksi Harian";
      const subjectName = getSubjectNameFromSlug(mappedItem.subjectSlug);

      try {
        const generatedReflection = await generateReflectionPrompt({
          userName: input.userName,
          subjectName,
          topicName: mappedItem.topicHint || conceptName,
        });
        mappedItem.reflection = generatedReflection;
      } catch (genErr) {
        console.error("Failed to generate fallback reflection:", genErr);
        mappedItem.reflection = {
          prompt: `Bagaimana pemahamanmu tentang konsep ${conceptName} setelah belajar hari ini? Jelaskan bagian yang paling menarik bagimu.`,
          context: `Refleksi tentang konsep ${conceptName}`,
        };
      }
    }

    if (kind === "QUESTION") parsedQuestions.push(mappedItem);
    else if (kind === "MATERIAL") parsedMaterials.push(mappedItem);
    else if (kind === "REFLECTION") parsedReflections.push(mappedItem);
  }

  // Enforce exact composition matching requested mixConfig
  const items: DailyMixPlan["items"] = [];
  const mix = input.mix ?? CHALLENGE_MIX_DEFAULT;

  // 1. Fulfill QUESTION items
  for (let i = 0; i < mix.questions; i++) {
    if (i < parsedQuestions.length) {
      items.push(parsedQuestions[i]);
    } else if (input.availableQuestions.length > 0) {
      // Pick an unused question from bank
      const usedIds = new Set(
        items.map((fi) => fi.conceptHint).filter(Boolean),
      );
      const unusedQ = input.availableQuestions.find(
        (q) => !usedIds.has(q.conceptName),
      );
      const fallbackQ = unusedQ || input.availableQuestions[0];
      items.push({
        kind: "QUESTION",
        subjectSlug: fallbackQ
          ? (fallbackQ.subjectSlug as SubjectSlug)
          : "MATEMATIKA",
        conceptHint: fallbackQ ? fallbackQ.conceptName : "Konsep Umum",
        difficultyHint:
          fallbackQ &&
          (fallbackQ.difficulty === "EASY" ||
            fallbackQ.difficulty === "MEDIUM" ||
            fallbackQ.difficulty === "HARD")
            ? fallbackQ.difficulty
            : "EASY",
        rationale: "Latihan harian berdasarkan bank soal.",
      });
    }
  }

  // 2. Fulfill MATERIAL items
  for (let i = 0; i < mix.materials; i++) {
    if (i < parsedMaterials.length) {
      items.push(parsedMaterials[i]);
    } else {
      // Generate fallback material
      const subjectSlug = input.focusedSubjects[0]
        ? (input.focusedSubjects[0] as SubjectSlug)
        : "MATEMATIKA";
      const subjectName = getSubjectNameFromSlug(subjectSlug);
      const conceptName = input.weakConcepts[i]?.name || "Materi Belajar";

      const fallbackItem: DailyMixPlan["items"][number] = {
        kind: "MATERIAL",
        subjectSlug,
        conceptHint: conceptName,
        difficultyHint: "EASY",
        rationale: "Materi belajar adaptif tambahan.",
      };

      try {
        const generatedMaterial = await generateMaterialMarkdown({
          userName: input.userName,
          subjectName,
          topicName: conceptName,
          conceptName,
          masteryScore: 0.3,
          learningStyle: input.learningStyle || undefined,
        });
        fallbackItem.material = generatedMaterial;
      } catch (genErr) {
        console.error("Failed to generate fallback material:", genErr);
        fallbackItem.material = {
          title: `${conceptName} — Panduan Singkat`,
          content: `## ${conceptName}\n\nMari pelajari konsep ${conceptName} ini. Konsep ini sangat penting untuk memahami dasar subjek ${subjectName}.\n\n### Pengantar\nPenjelasan singkat materi.\n\n💭 Coba pikirkan: Bagaimana menerapkan konsep ini dalam kehidupan sehari-hari?`,
          keyPoints: ["Memahami definisi dasar", "Menerapkan contoh soal"],
          estimatedMinutes: 5,
          difficulty: "EASY",
        };
      }
      items.push(fallbackItem);
    }
  }

  // 3. Fulfill REFLECTION items
  for (let i = 0; i < mix.reflections; i++) {
    if (i < parsedReflections.length) {
      items.push(parsedReflections[i]);
    } else {
      // Generate fallback reflection
      const subjectSlug = input.focusedSubjects[0]
        ? (input.focusedSubjects[0] as SubjectSlug)
        : "MATEMATIKA";
      const subjectName = getSubjectNameFromSlug(subjectSlug);
      const conceptName = input.weakConcepts[i]?.name || "Refleksi Diri";

      const fallbackItem: DailyMixPlan["items"][number] = {
        kind: "REFLECTION",
        subjectSlug,
        conceptHint: conceptName,
        difficultyHint: "EASY",
        rationale: "Refleksi harian adaptif.",
      };

      try {
        const generatedReflection = await generateReflectionPrompt({
          userName: input.userName,
          subjectName,
          topicName: conceptName,
        });
        fallbackItem.reflection = generatedReflection;
      } catch (genErr) {
        console.error("Failed to generate fallback reflection:", genErr);
        fallbackItem.reflection = {
          prompt: `Bagaimana pemahamanmu tentang konsep ${conceptName} setelah belajar hari ini? Jelaskan bagian yang paling menarik bagimu.`,
          context: `Refleksi tentang konsep ${conceptName}`,
        };
      }
      items.push(fallbackItem);
    }
  }

  return {
    title,
    description,
    items,
    reasoning,
  };
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
  console.log("[AI_SERVICE] analyzeReflection start");
  const userPrompt = `Prompt refleksi yang diberikan:
"""
${prompt}
"""

${context ? `Konteks:\n${context}\n` : ""}Jawaban siswa:
"""
${response}
"""

Analisis jawaban siswa di atas. Tentukan sentimen (POSITIVE jika siswa semangat, NEGATIVE jika frustrasi/merasa gagal, NEUTRAL selain itu), kedalaman (SURFACE = jawaban singkat generik, MODERATE = ada insight tapi belum dalam, DEEP = menunjukkan refleksi bermakna), dan 1-3 saran actionable untuk siswa.`;

  try {
    const systemPrompt =
      'Kamu adalah analis refleksi siswa. Berikan analisis yang jujur, suportif, dan actionable. Jangan menghakimi jawaban siswa. Kembalikan output JSON dengan format:\n{\n  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",\n  "depth": "SURFACE" | "MODERATE" | "DEEP",\n  "suggestions": ["saran 1", "saran 2"]\n}';
    console.log("[AI_SERVICE] analyzeReflection request", {
      model: chatModel,
      system: systemPrompt,
      prompt: userPrompt,
    });
    const { text } = await generateText({
      model: chatModel,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.3,
    });
    console.log("[AI_SERVICE] analyzeReflection response", { text });

    const rawJson = safeParseJson(text) as Record<string, unknown>;
    const sentiment = (rawJson.sentiment as string) || "NEUTRAL";
    const depth = (rawJson.depth as string) || "MODERATE";
    const suggestions = Array.isArray(rawJson.suggestions)
      ? (rawJson.suggestions as string[])
      : ["Teruslah belajar dan berefleksi!"];
    return {
      sentiment: (["POSITIVE", "NEUTRAL", "NEGATIVE"].includes(sentiment)
        ? sentiment
        : "NEUTRAL") as "POSITIVE" | "NEUTRAL" | "NEGATIVE",
      depth: (["SURFACE", "MODERATE", "DEEP"].includes(depth)
        ? depth
        : "MODERATE") as "SURFACE" | "MODERATE" | "DEEP",
      suggestions: suggestions.slice(0, 3),
    };
  } catch (err: unknown) {
    console.warn("analyzeReflection failed, using recovery. Error:", err);
    return {
      sentiment: "NEUTRAL",
      depth: "MODERATE",
      suggestions: [
        "Pertahankan semangat belajarmu!",
        "Coba diskusikan materi ini dengan Spark.",
      ],
    };
  }
}

export async function generateReflectionPrompt(args: {
  userName?: string;
  subjectName: string;
  topicName?: string;
  materialTitle?: string;
  recentReflections?: string[];
}): Promise<{ prompt: string; context: string }> {
  console.log("[AI_SERVICE] generateReflectionPrompt start", {
    subjectName: args.subjectName,
  });
  try {
    const systemPrompt =
      'Kamu adalah perancang prompt refleksi untuk siswa SMA/SMK. Buat prompt yang terbuka, memicu metacognition, bukan pertanyaan tertutup. Kembalikan output JSON dengan format:\n{\n  "prompt": "Pertanyaan refleksi",\n  "context": "Konteks refleksi"\n}';
    const userPrompt = `Buat 1 prompt refleksi untuk siswa ${
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
- Bisa dijawab 2-4 kalimat`;

    console.log("[AI_SERVICE] generateReflectionPrompt request", {
      model: chatModel,
      system: systemPrompt,
      prompt: userPrompt,
    });
    const { text } = await generateText({
      model: chatModel,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.6,
    });
    console.log("[AI_SERVICE] generateReflectionPrompt response", { text });

    const rawJson = safeParseJson(text) as Record<string, unknown>;
    const prompt = (rawJson.prompt ||
      rawJson.promptRefleksi ||
      "Bagaimana pemahamanmu tentang materi ini?") as string;
    const context = (rawJson.context ||
      rawJson.konteks ||
      "Refleksi pembelajaran") as string;
    return { prompt, context };
  } catch (err: unknown) {
    console.warn(
      "generateReflectionPrompt failed, using recovery. Error:",
      err,
    );
    return {
      prompt: `Bagaimana pemahamanmu tentang konsep ${args.topicName || args.subjectName} setelah belajar hari ini? Jelaskan bagian yang paling menarik bagimu.`,
      context: `Refleksi tentang konsep ${args.topicName || args.subjectName}`,
    };
  }
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
  console.log("[AI_SERVICE] generateMaterialMarkdown start", {
    conceptName: args.conceptName,
  });
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

  const systemPrompt = `Kamu adalah Spark — tutor AI yang sabar dan suportif untuk siswa SMA/SMK Indonesia.

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

Panjang: 400-800 kata. Output HANYA markdown, jangan ada penjelasan meta.`;

  const userPrompt = `Mapel: ${args.subjectName}
Topik: ${args.topicName}
Konsep: ${args.conceptName}
Tingkat pemahaman siswa saat ini: ${(args.masteryScore * 100).toFixed(0)}%

Buat materi bacaan yang membantu siswa memahami konsep "${args.conceptName}" lebih dalam. Materi akan disimpan permanen untuk diulang baca, jadi pastikan self-contained.`;

  console.log("[AI_SERVICE] generateMaterialMarkdown request", {
    model: chatModel,
    system: systemPrompt,
    prompt: userPrompt,
  });
  const result = await generateText({
    model: chatModel,
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.6,
  });
  console.log("[AI_SERVICE] generateMaterialMarkdown response", {
    text: result.text,
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

export interface WeeklyChallengeInput {
  userName?: string;
  grade?: number | null;
  focusedSubjects: string[];
}

export const weeklyChallengeSchema = z.object({
  title: z.string().max(80).describe("Judul tantangan mingguan, asyik & memotivasi"),
  description: z.string().max(200).describe("Deskripsi singkat tantangan mingguan"),
  goal: z.number().int().min(5).max(12).describe("Jumlah item tantangan harian yang harus diselesaikan (5-12)"),
});

export type WeeklyChallengePlan = z.infer<typeof weeklyChallengeSchema>;

export async function generateWeeklyChallengeAI(
  input: WeeklyChallengeInput,
): Promise<WeeklyChallengePlan> {
  console.log("[AI_SERVICE] generateWeeklyChallengeAI start");

  const systemPrompt = `Kamu adalah Spark — tutor AI personal untuk siswa SMA/SMK Indonesia.
Tugasmu adalah merancang TANTANGAN MINGGUAN (Weekly Challenge) untuk memotivasi siswa menyelesaikan tugas belajarnya minggu ini.
Kembalikan output JSON valid sesuai format schema berikut:
{
  "title": "Judul tantangan mingguan",
  "description": "Deskripsi motivatif singkat",
  "goal": 8 // Jumlah item tantangan yang harus diselesaikan minggu ini (antara 5 sampai 12)
}`;

  const userPrompt = `Rancang tantangan mingguan untuk siswa:
- Nama: ${input.userName ?? "Siswa"}
- Kelas: ${input.grade ?? "belum diisi"}
- Mata pelajaran fokus: ${input.focusedSubjects.join(", ") || "Semua Mapel"}
  
Buatlah judul dan deskripsi yang seru dan asyik khas Spark AI!`;

  try {
    const { text } = await generateText({
      model: chatModel,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    const rawJson = safeParseJson(text) as Record<string, unknown>;
    const title = typeof rawJson.title === "string" ? rawJson.title.slice(0, 80) : "Misi Mingguan: Pemburu Ilmu";
    const description = typeof rawJson.description === "string" ? rawJson.description.slice(0, 200) : "Selesaikan tantangan belajar minggu ini untuk klaim bonus XP!";
    const goal = typeof rawJson.goal === "number" ? Math.max(5, Math.min(12, rawJson.goal)) : 8;

    return { title, description, goal };
  } catch (err) {
    console.warn("generateWeeklyChallengeAI failed, using fallback:", err);
    return {
      title: "Misi Mingguan: Konsistensi Belajar",
      description: "Selesaikan 8 item tantangan belajar harian minggu ini untuk mengklaim reward 100 XP!",
      goal: 8,
    };
  }
}

