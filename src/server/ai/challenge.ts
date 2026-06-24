import "server-only";

import { z } from "zod";
import { chatModel, generateText } from "@/lib/ai";
import { aiLog, formatErr, EMOJI } from "@/lib/ai-logger";
import { sanitizeNameForPrompt, sanitizeForPrompt } from "@/lib/prompt-sanitize";
import { retryOnZodError } from "@/server/utils/ai-retry";
import { countWords } from "@/server/utils/word-count";
import type { SubjectSlug } from "../../../generated/prisma/client";

const isDev = process.env.NODE_ENV !== "production";

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
    .min(1)
    .describe(
      "Konten materi dalam format Markdown. WAJIB ada heading (##), minimal 2 section, dan ringkas. Panjang 300-800 kata.",
    ),
  keyPoints: z
    .array(z.string())
    .min(2)
    .max(8)
    .describe("2-8 poin penting yang harus diingat siswa"),
  estimatedMinutes: z
    .number()
    .int()
    .min(10)
    .max(45)
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
    .string()
    .max(100)
    .describe(
      "Slug mapel (uppercase) untuk mapel nasional, atau NAMA MAPEL PERSIS untuk mapel custom. Contoh: 'MATEMATIKA', 'BAHASA_INGGRIS', atau 'Bahasa Jawa' untuk mapel custom.",
    ),
  subjectName: z
    .string()
    .max(100)
    .optional()
    .describe("Nama mapel custom (opsional, untuk mapping ke subject ID)"),
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
    .min(1)
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

🔴🔴🔴 ATURAN KERAS (PATUHI ATAU OUTPUT DITOLAK):
🔴 R1. MATERIAL content WAJIB ≥300 KATA / ≥1500 karakter. HITUNG MANUAL. SETIAP KATA DIHITUNG. KALAU KURANG 300 KATA, OUTPUT DITOLAK.
🔴 R2. Output HANYA JSON valid. TIDAK BOLEH ada teks lain di luar JSON. TIDAK BOLEH ada markdown \"\`\`\`json. Kalau ada teks tambahan, OUTPUT DITOLAK.
🔴 R3. Setiap MATERIAL wajib punya: heading (##), minimal 2 section (###), keyPoints (≥2), penutup. Format: intro → konsep inti → contoh → summary → \"💭 Coba pikirkan\".
🔴 R4. Material content TIDAK BOLEH pake paragraph pendek. SETIAP SECTION minimal 3-4 kalimat.
🔴 R5. QUESTION hanya pilih dari bank soal yang dikasih. JANGAN generate soal baru.
🔴 R6. Reflection HARUS pertanyaan terbuka (bukan yes/no).
🔴 R7. subjectSlug HARUS dari focusedSubjects atau weakConcepts siswa.
🔴 R8. Variasi: jangan ulang subject/concept yang sama seperti 5 hari terakhir.

PANDUAN TAMBAHAN:
- Output dalam Bahasa Indonesia.
- Untuk mapel nasional, slug uppercase: "MATEMATIKA", "BAHASA_INDONESIA", "BAHASA_INGGRIS", "IPA", "SEJARAH", "GEOGRAFI", "EKONOMI", "SOSIOLOGI", "PPKN", "SENI_BUDAYA", "PJOK", "PRAKARYA", "BAHASA_DAERAH", "CODING". Untuk CUSTOM, gunakan NAMA MAPEL PERSIS dari focusedSubjects.
- Difficulty: mastery < 0.4 → EASY, mastery > 0.7 → HARD, sisanya MEDIUM.
- Sesuaikan gaya penulisan dengan learningStyle:
  * VISUAL: Wajib diagram Mermaid.js.
  * EXAMPLE_HEAVY: Studi kasus nyata + bedah langkah demi langkah.
  * SOCRATIC: Dialog tanya-jawab "Siswa" dan "Spark".
  * TEXTUAL: Akademis, glosarium, referensi formal.
- Sesuaikan kedalaman dengan grade siswa.
- Reasoning: jelaskan kenapa komposisi ini cocok.

🚨 SEBELUM OUTPUT, VERIFIKASI DIRI:
[  ] Semua MATERIAL content ≥300 kata / ≥1500 karakter?
[  ] Output cuma JSON, tanpa teks lain?
[  ] Semua MATERIAL punya heading ##, section ###, keyPoints, penutup?
[  ] QUESTION cuma dari bank soal yang dikasih?
[  ] Reflection bukan yes/no?
[  ] subjectSlug sesuai data siswa?

Kalau ada yang belum centang, JANGAN OUTPUT. Perbaiki dulu.

Format JSON:
{
  "title": "Judul paket",
  "description": "Deskripsi singkat",
  "items": [
      "kind": "QUESTION",
      "subjectSlug": "MATEMATIKA" | "BAHASA_INDONESIA" | ...,
      "conceptHint": "Nama konsep",
      "difficultyHint": "EASY" | "MEDIUM" | "HARD",
      "rationale": "Kenapa ini dipilih"
    ,{
      "kind": "MATERIAL",
      "subjectSlug": "MATEMATIKA" | "BAHASA_INDONESIA" | ...,
      "conceptHint": "Nama konsep",
      "difficultyHint": "EASY" | "MEDIUM" | "HARD",
      "rationale": "Kenapa ini dipilih",
      "material": {
        "title": "Judul materi",
        "content": "Isi materi markdown lengkap minimal 300 kata...\n\n## Bagian 1\n...\n\n### Sub Bagian\n...",
        "keyPoints": ["poin 1", "poin 2", "poin 3"],
        "estimatedMinutes": 10,
        "difficulty": "EASY" | "MEDIUM" | "HARD"
      }
    },{
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
    // Track escape state: backslash toggles escaped, everything else resets
    if (escaped) {
      // Previous char was an unescaped backslash — this char is escaped
      escaped = false;
    } else if (char === "\\" && inString) {
      escaped = true;
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
    } catch (parseErr) {
      aiLog.warn(`${EMOJI.warn} safeParseJson gagal parse kandidat: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
      throw new Error(
        `JSON parsing failed: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
      );
    }
  }

  const sanitizedClean = sanitizeJsonString(text.trim());
  try {
    return JSON.parse(sanitizedClean);
  } catch (finalErr) {
    throw new Error(
      `JSON parsing failed: no valid JSON object found in AI output. ${finalErr instanceof Error ? finalErr.message : String(finalErr)}`,
    );
  }
}

export async function generateDailyMix(
  input: DailyMixInput,
): Promise<DailyMixPlan> {
  aiLog.info(`${EMOJI.start} generateDailyMix — user: ${input.userId}`);
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
- Nama: ${sanitizeNameForPrompt(input.userName) ?? "Siswa"}
- Kelas: ${input.grade ?? "belum diisi"}
- Sekolah: ${sanitizeForPrompt(input.school) ?? "belum diisi"}
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
    aiLog.info(`${EMOJI.model} generateDailyMix → memanggil AI ...`);
    const { text } = await generateText({
      model: chatModel,
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.7,
    });
    aiLog.info(`${EMOJI.ok} generateDailyMix selesai`);

    const rawJson = safeParseJson(text);
    const mapped = await tryMapAndRecoverMixPlan(rawJson, input);
    if (!mapped) {
      throw new Error("Failed to parse daily mix plan from AI output");
    }

    const parsed = dailyMixPlanSchema.parse(mapped);
    validateMixPlan(parsed, mix);
    return parsed;
  } catch (err: unknown) {
    aiLog.error(`${EMOJI.error} generateDailyMix gagal: ${formatErr(err)}`);
    throw err;
  }
}

function normalizeSubjectSlug(slug: string): string {
  const s = slug.toUpperCase().trim();
  // National subject abbreviations
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
  // For custom subjects, return the original slug (preserve case for name matching)
  return slug.trim();
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

export async function tryMapAndRecoverMixPlan(
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
    const subjectName = item.subjectName as string | undefined;
    if (typeof subjectSlug === "string") {
      subjectSlug = normalizeSubjectSlug(subjectSlug);
    } else {
      subjectSlug = "MATEMATIKA";
    }
    // For custom subjects, use subjectName if available
    if (subjectSlug === "CUSTOM" && subjectName) {
      subjectSlug = subjectName;
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
        aiLog.error(`${EMOJI.error} Fallback material gagal: ${formatErr(genErr)}`);
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
        aiLog.error(`${EMOJI.error} Fallback reflection gagal: ${formatErr(genErr)}`);
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
        aiLog.error(`${EMOJI.error} Fallback material gagal: ${formatErr(genErr)}`);
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
        aiLog.error(`${EMOJI.error} Fallback reflection gagal: ${formatErr(genErr)}`);
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
  aiLog.info(`${EMOJI.start} analyzeReflection`);
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
    aiLog.info(`${EMOJI.model} analyzeReflection → memanggil AI ...`);
    const { text } = await generateText({
      model: chatModel,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.3,
    });
    aiLog.info(`${EMOJI.ok} analyzeReflection selesai`);

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
    aiLog.warn(`${EMOJI.warn} analyzeReflection gagal, pakai recovery: ${formatErr(err)}`);
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
  aiLog.info(`${EMOJI.start} generateReflectionPrompt — ${args.subjectName}`);
  try {
    const systemPrompt =
      'Kamu adalah perancang prompt refleksi untuk siswa SMA/SMK. Buat prompt yang terbuka, memicu metacognition, bukan pertanyaan tertutup. Kembalikan output JSON dengan format:\n{\n  "prompt": "Pertanyaan refleksi",\n  "context": "Konteks refleksi"\n}';
    const userPrompt = `Buat 1 prompt refleksi untuk siswa ${
      sanitizeNameForPrompt(args.userName) ?? "SMA/SMK"
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

    aiLog.info(`${EMOJI.model} generateReflectionPrompt → memanggil AI ...`);
    const { text } = await generateText({
      model: chatModel,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.6,
    });
    aiLog.info(`${EMOJI.ok} generateReflectionPrompt selesai`);

    const rawJson = safeParseJson(text) as Record<string, unknown>;
    const prompt = (rawJson.prompt ||
      rawJson.promptRefleksi ||
      "Bagaimana pemahamanmu tentang materi ini?") as string;
    const context = (rawJson.context ||
      rawJson.konteks ||
      "Refleksi pembelajaran") as string;
    return { prompt, context };
  } catch (err: unknown) {
    aiLog.warn(`${EMOJI.warn} generateReflectionPrompt gagal, pakai recovery: ${formatErr(err)}`);
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
  return retryOnZodError(() => _generateMaterialMarkdownInner(args));
}

const materialContentSchema = z.object({
  content: z.string().min(1),
});

async function _generateMaterialMarkdownInner(
  args: Parameters<typeof generateMaterialMarkdown>[0],
): Promise<{
  title: string;
  content: string;
  keyPoints: string[];
  estimatedMinutes: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
}> {
  aiLog.info(`${EMOJI.start} generateMaterialMarkdown — ${args.conceptName}`);
  const difficulty =
    args.masteryScore < 0.4
      ? "EASY"
      : args.masteryScore > 0.7
        ? "HARD"
        : "MEDIUM";

  const styleNote =
    args.learningStyle === "VISUAL"
      ? "Siswa memiliki gaya belajar VISUAL. Wajib sertakan visualisasi konsep berupa diagram alir/peta konsep menggunakan sintaks Mermaid.js (misal: ```mermaid\ngraph TD\n...\n```) dan gunakan analogi visual imajinatif."
      : args.learningStyle === "EXAMPLE_HEAVY"
        ? "Siswa memiliki gaya belajar EXAMPLE_HEAVY. Struktur materi wajib difokuskan pada Studi Kasus nyata atau contoh soal konkret, serta bedah solusi langkah-demi-langkah yang jelas."
        : args.learningStyle === "SOCRATIC"
          ? "Siswa memiliki gaya belajar SOCRATIC. Sajikan materi dalam bentuk dialog tanya-jawab interaktif antara 'Siswa' dan 'Spark' untuk menuntun siswa memahami konsep tersebut."
          : "Siswa memiliki gaya belajar TEXTUAL. Berikan penjelasan akademis yang runtut, mendalam, terstruktur dengan sub-bab jelas, glosarium istilah, dan teori formal.";

  const systemPrompt = `Kamu adalah Spark — tutor AI yang sabar dan suportif untuk siswa SMA/SMK Indonesia.

🔴 ATURAN KERAS — PATUHI ATAU OUTPUT DITOLAK:
🔴 [CONTENT] WAJIB 300-800 kata (≥300 kata / ≥1500 karakter). HITUNG MANUAL. KALAU KURANG, OUTPUT DITOLAK.
🔴 [STRUKTUR] WAJIB: ## judul → intro 1 paragraf → minimal 3 section ### → contoh konkret + pembahasan → aplikasi nyata → ringkasan → 💭 Coba pikirkan.
🔴 [SECTION] SETIAP section ### minimal 4 kalimat. TIDAK BOLEH cuma 1-2 kalimat.
🔴 [OUTPUT] HANYA markdown. TIDAK BOLEH ada teks meta, penjelasan, atau basa-basi.
🔴 [GAYA] Sesuai gaya belajar siswa:
${styleNote.replace(/^/gm, '   ')}
🔴 [DIFFICULTY] ${difficulty === "EASY" ? "Bahasa sederhana, analogi sehari-hari, definisi dulu baru contoh." : difficulty === "HARD" ? "Terminologi advanced, dorong analitis." : "Definisi + contoh + insight."}`;

  const userPrompt = `Mapel: ${args.subjectName}
Topik: ${args.topicName}
Konsep: ${args.conceptName}
Tingkat pemahaman siswa saat ini: ${(args.masteryScore * 100).toFixed(0)}%

Buat materi bacaan yang membantu siswa memahami konsep "${args.conceptName}" lebih dalam. Materi akan disimpan permanen untuk diulang baca, jadi pastikan self-contained.`;

  aiLog.info(`${EMOJI.model} generateMaterialMarkdown → memanggil AI ...`);
  const result = await generateText({
    model: chatModel,
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.6,
  });
  aiLog.info(`${EMOJI.ok} generateMaterialMarkdown selesai`);

  const keyPoints = await extractKeyPoints(result.text);

  return {
    title: `${args.conceptName} — Panduan Singkat`,
    content: result.text,
    keyPoints,
    estimatedMinutes: Math.max(10, Math.min(45, Math.ceil(500 / 200))),
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
  title: z
    .string()
    .max(80)
    .describe("Judul tantangan mingguan, asyik & memotivasi"),
  description: z
    .string()
    .max(200)
    .describe("Deskripsi singkat tantangan mingguan"),
  goal: z
    .number()
    .int()
    .min(5)
    .max(12)
    .describe("Jumlah item tantangan harian yang harus diselesaikan (5-12)"),
});

export type WeeklyChallengePlan = z.infer<typeof weeklyChallengeSchema>;

export async function generateWeeklyChallengeAI(
  input: WeeklyChallengeInput,
): Promise<WeeklyChallengePlan> {
  aiLog.info(`${EMOJI.start} generateWeeklyChallengeAI`);

  const systemPrompt = `Kamu adalah Spark — tutor AI personal untuk siswa SMA/SMK Indonesia.
Tugasmu adalah merancang TANTANGAN MINGGUAN (Weekly Challenge) untuk memotivasi siswa menyelesaikan tugas belajarnya minggu ini.
Kembalikan output JSON valid sesuai format schema berikut:
{
  "title": "Judul tantangan mingguan",
  "description": "Deskripsi motivatif singkat",
  "goal": 8 // Jumlah item tantangan yang harus diselesaikan minggu ini (antara 5 sampai 12)
}`;

  const userPrompt = `Rancang tantangan mingguan untuk siswa:
- Nama: ${sanitizeNameForPrompt(input.userName) ?? "Siswa"}
- Kelas: ${input.grade ?? "belum diisi"}
- Mata pelajaran fokus: ${input.focusedSubjects.map(s => sanitizeForPrompt(s)).join(", ") || "Semua Mapel"}
  
Buatlah judul dan deskripsi yang seru dan asyik khas Spark AI!`;

  try {
    const { text } = await generateText({
      model: chatModel,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    const rawJson = safeParseJson(text) as Record<string, unknown>;
    const title =
      typeof rawJson.title === "string"
        ? rawJson.title.slice(0, 80)
        : "Misi Mingguan: Pemburu Ilmu";
    const description =
      typeof rawJson.description === "string"
        ? rawJson.description.slice(0, 200)
        : "Selesaikan tantangan belajar minggu ini untuk klaim bonus XP!";
    const goal =
      typeof rawJson.goal === "number"
        ? Math.max(5, Math.min(12, rawJson.goal))
        : 8;

    return { title, description, goal };
  } catch (err) {
    aiLog.warn(`${EMOJI.warn} generateWeeklyChallengeAI gagal, pakai fallback: ${formatErr(err)}`);
    return {
      title: "Misi Mingguan: Konsistensi Belajar",
      description:
        "Selesaikan 8 item tantangan belajar harian minggu ini untuk mengklaim reward 100 XP!",
      goal: 8,
    };
  }
}

export const weeklyQuestionSchema = z.object({
  questionText: z
    .string()
    .describe("Soal HARD pilihan ganda untuk tantangan mingguan"),
  options: z.array(z.string()).length(4).describe("4 pilihan jawaban"),
  correctAnswer: z
    .string()
    .describe("Jawaban benar, harus persis sama dengan salah satu opsi"),
  explanation: z
    .string()
    .describe("Penjelasan detail kenapa jawaban itu benar"),
  hint: z
    .string()
    .describe("Petunjuk berupa pertanyaan pancingan (bukan bocoran jawaban)"),
  subjectName: z.string().describe("Nama mapel yang soal ini rujuk"),
});

export const weeklyMaterialSchema = z.object({
  title: z.string().max(100).describe("Judul materi"),
  content: z
    .string()
    .min(200)
    .describe("Materi belajar dalam format Markdown (300-800 kata)"),
  keyPoints: z
    .array(z.string())
    .min(2)
    .max(8)
    .describe("2-8 poin penting dari materi"),
  estimatedMinutes: z
    .number()
    .int()
    .min(3)
    .max(30)
    .describe("Estimasi waktu baca dalam menit"),
  subjectName: z.string().describe("Nama mapel yang materi ini rujuk"),
});

// LEGACY: Only used by the legacy generateWeeklyChallengeContent function below.
// Kept for backwards compatibility; new code uses weeklyPerSubjectContentSchema.
export const weeklyContentSchema = z.object({
  questions: z
    .array(weeklyQuestionSchema)
    .min(5)
    .max(15)
    .describe("5-15 soal HARD"),
  materials: z
    .array(weeklyMaterialSchema)
    .min(1)
    .max(3)
    .describe("1-3 materi mendalam"),
});

export type WeeklyContent = z.infer<typeof weeklyContentSchema>;

export async function generateWeeklyChallengeContent(
  input: WeeklyChallengeInput,
): Promise<WeeklyContent> {
  aiLog.info(`${EMOJI.start} generateWeeklyChallengeContent`);

  const systemPrompt = `Kamu adalah Spark — tutor AI personal untuk siswa SMA/SMK Indonesia.
Tugasmu adalah membuat konten TANTANGAN MINGGUAN berupa soal-soal SULIT dan materi MENDALAM untuk siswa.

ATURAN WAJIB:
1. Semua soal harus HARD (sulit) - menguji pemahaman mendalam, bukan hafalan.
2. Soal harus membutuhkan analisis, sintesis, atau aplikasi konsep.
3. Setiap soal punya 4 opsi jawaban dengan 1 jawaban benar yang pasti.
4. correctAnswer HARUS persis sama dengan salah satu string di options.
5. Materi harus 300-800 kata, format Markdown bersih, dengan penjelasan mendalam.
6. Materi harus menyertakan contoh konkret dan aplikasi di kehidupan nyata.
7. Bahasa Indonesia yang asyik dan engaging untuk siswa SMA/SMK.
8. Output HARUS JSON valid sesuai format yang diminta.
9. JANGAN bungkus output dalam markdown wrapper (json fence atau sejenisnya). Langsung output JSON murni.`;

  const userPrompt = `Buat konten tantangan mingguan untuk siswa:
- Nama: ${sanitizeNameForPrompt(input.userName) ?? "Siswa"}
- Kelas: ${input.grade ?? "SMA"}
- Mata pelajaran fokus: ${input.focusedSubjects.map(s => sanitizeForPrompt(s)).join(", ") || "Semua Mapel"}
  
Buatlah 8-15 soal HARD (sulit) pilihan ganda dan 1-3 materi mendalam yang merujuk pada mapel-mapel di atas. Soal harus benar-benar sulit, bukan soal mudah. Materi harus panjang dan berbobot.`;

  try {
    const { text } = await generateText({
      model: chatModel,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.6,
    });

    const parsedJson = safeParseJson(text);
    const validated = weeklyContentSchema.parse(parsedJson);
    return validated;
  } catch (err) {
    aiLog.warn(`${EMOJI.warn} generateWeeklyChallengeContent parse utama gagal, coba alternatif: ${formatErr(err)}`);
    try {
      const { text: retryText } = await generateText({
        model: chatModel,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.6,
      });
      const parsedJson = safeParseJson(retryText);
      const partial = parsedJson as Record<string, unknown>;
      const questions = Array.isArray(partial.questions)
        ? partial.questions
        : [];
      const materials = Array.isArray(partial.materials)
        ? partial.materials
        : [];
      if (questions.length > 0 || materials.length > 0) {
        return { questions, materials } as WeeklyContent;
      }
    } catch {
      // ignore recovery failure
    }
    return { questions: [], materials: [] };
  }
}

// ============================================================================
// §6 New: Per-subject weekly AI generators
// ============================================================================

export const weeklyPerSubjectQuestionSchema = z.object({
  questionText: z.string().min(10).max(600),
  options: z.array(z.string()).length(4),
  correctAnswer: z.string(),
  explanation: z.string().min(20).max(500),
  hint: z.string().min(5).max(200),
});

export const weeklyPerSubjectMaterialSchema = z.object({
  title: z.string().min(3).max(120),
  content: z.string().min(400).max(8000),
  keyPoints: z.array(z.string()).min(2).max(8),
  estimatedMinutes: z.number().int().min(5).max(60),
});

export const weeklyPerSubjectContentSchema = z.object({
  questions: z.array(weeklyPerSubjectQuestionSchema).max(10),
  materials: z.array(weeklyPerSubjectMaterialSchema).max(3),
});

export type WeeklyPerSubjectContent = z.infer<
  typeof weeklyPerSubjectContentSchema
>;

export async function generateWeeklyPerSubjectAI(input: {
  subjectName: string;
  subjectSlug: SubjectSlug | string;
  learningStyle?: string;
  strength: "weak" | "balanced" | "strong";
  questionsCount: number;
  materialsCount: number;
}): Promise<WeeklyPerSubjectContent> {
  const styleHint = learningStyleHint(input.learningStyle);
  const strengthHint = strengthHintText(input.strength);

  const systemPrompt = `Kamu adalah Spark — tutor AI yang sabar dan suportif untuk siswa SMA/SMK Indonesia.

Buat konten TANTANGAN MINGGUAN DEEP DIVE untuk satu mata pelajaran.

ATURAN WAJIB:
- ${input.questionsCount} soal HARD pilihan ganda (4 opsi A/B/C/D, 1 jawaban benar)
- ${input.materialsCount} materi markdown (400-800 kata per materi)
- Soal HARUS menguji ANALISIS, EVALUASI, atau CREATE (bukan hafalan)
- correctAnswer HARUS persis sama dengan salah satu string di options
- Materi wajib pakai heading ##, section ###, contoh konkret, summary
- Bahasa Indonesia yang asyik untuk remaja
- Output HARUS JSON valid sesuai format. Jangan bungkus dengan markdown fence.
- Setiap materi 5-8 keyPoints

${styleHint}

${strengthHint}

Format output:
{
  "questions": [
    {
      "questionText": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctAnswer": "A. ...",
      "explanation": "Penjelasan 100-200 kata",
      "hint": "Pertanyaan pancingan, BUKAN bocoran"
    }
  ],
  "materials": [
    {
      "title": "...",
      "content": "Markdown 400-800 kata",
      "keyPoints": ["poin 1", "poin 2", ...],
      "estimatedMinutes": 30
    }
  ]
}`;

  const userPrompt = `Mapel: ${input.subjectName}
Jumlah soal: ${input.questionsCount}
Jumlah materi: ${input.materialsCount}

Buat konten tantangan mingguan untuk mapel di atas. Output JSON.`;

  try {
    const { text } = await generateText({
      model: chatModel,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.6,
    });

    const rawJson = safeParseJson(text);
    const validated = weeklyPerSubjectContentSchema.parse(rawJson);
    return {
      questions: validated.questions.slice(0, input.questionsCount),
      materials: validated.materials.slice(0, input.materialsCount),
    };
  } catch (err) {
    aiLog.warn(`${EMOJI.warn} generateWeeklyPerSubjectAI gagal: ${formatErr(err)}`);
    return { questions: [], materials: [] };
  }
}

function learningStyleHint(style?: string): string {
  switch (style) {
    case "VISUAL":
      return `Gaya belajar siswa: VISUAL. WAJIB terapkan:
- Minimal 2 diagram Mermaid.js (graph TD/LR) untuk memetakan hubungan konsep
- Analogi visual imajinatif (contoh: "Bayangkan konsep ini seperti...")
- Tabel perbandingan untuk data numerik
- Emoji visual (🎯 📊 🔄 💡) sebagai penanda section`;
    case "TEXTUAL":
      return `Gaya belajar siswa: TEXTUAL. WAJIB terapkan:
- Format akademis terstruktur: heading bertingkat, glosarium istilah
- Penjelasan runtut: Definisi → Teori → Contoh → Kesimpulan
- Bullet points dan numbered lists untuk langkah-langkah
- Bahasa formal tapi mudah dipahami`;
    case "EXAMPLE_HEAVY":
      return `Gaya belajar siswa: EXAMPLE_HEAVY. WAJIB terapkan:
- Setiap konsep utama WAJIB diikuti minimal 2 contoh konkret dengan pembahasan lengkap
- Struktur: Teori singkat → Contoh + pembahasan step-by-step → Ringkasan
- Prioritaskan "cara mengerjakan" daripada teori murni
- Studi kasus nyata dari kehidupan sehari-hari`;
    case "SOCRATIC":
      return `Gaya belajar siswa: SOCRATIC. WAJIB terapkan:
- Format dialog tanya-jawab antara 'Siswa' dan 'Spark'
- Jangan langsung kasih jawaban, gunakan pertanyaan retoris untuk menuntun
- Pertanyaan bertingkat dari mudah ke sulit
- Akhiri dengan refleksi: "💭 Sekarang coba jelaskan dengan kata-katamu sendiri..."`;
    default:
      return "Gaya belajar: BALANCED — kombinasi semua format.";
  }
}

function strengthHintText(strength: "weak" | "balanced" | "strong"): string {
  if (strength === "weak") {
    return "Strength: WEAK — soal ANALYZE, materi dengan analogi sederhana + step-by-step.";
  }
  if (strength === "strong") {
    return "Strength: STRONG — soal EVALUATE/CREATE, materi lebih dalam dengan terminologi advanced.";
  }
  return "Strength: BALANCED — soal APPLY/ANALYZE, materi penjelasan + aplikasi.";
}

export async function generateWeeklyDeepMaterial(input: {
  subjectName: string;
  conceptName: string;
  learningStyle?: string;
  masteryScore: number;
}): Promise<{
  title: string;
  content: string;
  keyPoints: string[];
  estimatedMinutes: number;
}> {
  try {
    return await retryOnZodError(() => _generateWeeklyDeepMaterialInner(input));
  } catch (err) {
    aiLog.warn(`${EMOJI.warn} generateWeeklyDeepMaterial gagal setelah retry: ${formatErr(err)}`);
    return {
      title: `${input.conceptName} — Deep Dive`,
      content: `## ${input.conceptName}\n\nMateri ini sedang disiapkan. Coba lagi nanti atau pilih mapel lain.`,
      keyPoints: ["Materi dalam persiapan"],
      estimatedMinutes: 30,
    };
  }
}

async function _generateWeeklyDeepMaterialInner(
  input: Parameters<typeof generateWeeklyDeepMaterial>[0],
): Promise<{
  title: string;
  content: string;
  keyPoints: string[];
  estimatedMinutes: number;
}> {
  const styleHint = learningStyleHint(input.learningStyle);

  const weeklyMaterialSchema = z.object({
    title: z.string().max(120),
    content: z
      .string()
      .min(3000)
      .refine((text) => countWords(text) >= 600, {
        message: "Materi weekly terlalu pendek, minimal 600 kata",
      }),
    keyPoints: z.array(z.string()).min(3).max(12),
    estimatedMinutes: z.number().int().min(15).max(90),
  });

  const systemPrompt = `Kamu adalah Spark — tutor AI untuk siswa SMA/SMK Indonesia.

Buat MATERI DEEP DIVE untuk tantangan mingguan.

WAJIB:
- 600-1000 kata Markdown (minimal 600 kata)
- Heading ## + minimal 2-3 section ###
- Penjelasan konsep sangat mendalam dan komprehensif
- Contoh konkret + studi kasus dunia nyata + aplikasi praktis
- Contoh soal kompleks dengan pembahasan detail
- Perbandingan dengan konsep terkait
- 3-6 keyPoints
- Ringkasan menyeluruh + callout "💭 Tantangan minggu ini: ..."
- Difficulty HARD (terminologi advanced, dorong berpikir analitis)

${styleHint}

Output JSON: { "title": "...", "content": "Markdown...", "keyPoints": [...], "estimatedMinutes": 15-30 }`;

  const userPrompt = `Mapel: ${input.subjectName}
Topik: ${input.conceptName}

Buat materi deep dive untuk topik ini. Output JSON.`;

  const { text } = await generateText({
    model: chatModel,
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.6,
  });

  const rawJson = safeParseJson(text) as Record<string, unknown>;
  const parsed = weeklyMaterialSchema.parse({
    title: String(rawJson.title ?? `${input.conceptName} — Deep Dive`).slice(
      0,
      120,
    ),
    content: String(rawJson.content ?? ""),
    keyPoints: Array.isArray(rawJson.keyPoints)
      ? (rawJson.keyPoints as string[]).slice(0, 12)
      : ["Poin utama konsep", "Aplikasi di kehidupan nyata"],
    estimatedMinutes:
      typeof rawJson.estimatedMinutes === "number"
        ? Math.max(30, Math.min(90, rawJson.estimatedMinutes))
        : 60,
  });
  return parsed;
}

export async function generateWeeklyTitleAI(input: {
  userName?: string;
  grade: number | null;
  subjectNames: string[];
}): Promise<{ title: string; description: string }> {
  const systemPrompt = `Kamu adalah Spark — tutor AI untuk siswa SMA/SMK Indonesia.
Buat judul + deskripsi singkat (1 kalimat) untuk tantangan mingguan.
Bahasa Indonesia asyik untuk remaja. JSON valid saja.`;

  const userPrompt = `Siswa: ${sanitizeNameForPrompt(input.userName) ?? "Siswa"}
Kelas: ${input.grade ?? "SMA"}
Mapel minggu ini: ${input.subjectNames.join(", ")}

Format JSON: { "title": "max 80 char", "description": "max 200 char" }`;

  try {
    const { text } = await generateText({
      model: chatModel,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });
    const rawJson = safeParseJson(text) as Record<string, unknown>;
    return {
      title: String(rawJson.title ?? "Misi Mingguan").slice(0, 80),
      description: String(
        rawJson.description ?? "Selesaikan tantangan mingguan!",
      ).slice(0, 200),
    };
  } catch (err) {
    aiLog.warn(`${EMOJI.warn} generateWeeklyTitleAI gagal: ${formatErr(err)}`);
    return {
      title: `Misi Mingguan: ${input.subjectNames[0] ?? "Pemburu Ilmu"}`,
      description: `Selesaikan tantangan mingguan untuk klaim 100 XP!`,
    };
  }
}
