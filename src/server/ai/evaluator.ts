import "server-only";

import { chatModel, generateText, safeParseJson } from "@/lib/ai";
import { aiLog, EMOJI } from "@/lib/ai-logger";

interface EvaluationResult {
  isCorrect: boolean;
  feedback: string;
  explanation: string;
  mastered: boolean;
  // BUG-9 FIX: Add flag to indicate AI failure (so caller can handle appropriately)
  aiFailed?: boolean;
}

export async function evaluateAnswer(
  question: string,
  correctAnswer: string,
  studentAnswer: string,
  questionType: string,
  conceptName?: string,
  learningStyle?: string | null,
): Promise<EvaluationResult> {
  aiLog.info(`${EMOJI.start} evaluateAnswer — tipe: ${questionType}`);
  if (questionType === "MULTIPLE_CHOICE" || questionType === "TRUE_FALSE") {
    const isCorrect =
      studentAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    return {
      isCorrect,
      feedback: isCorrect
        ? "Benar! Bagus sekali."
        : `Belum tepat. Jawaban yang benar: ${correctAnswer}`,
      explanation: isCorrect
        ? "Kamu sudah memahami konsep ini dengan baik."
        : `Yuk pelajari lagi konsep ini.`,
      mastered: isCorrect,
    };
  }

  const styleInstructions: Record<string, string> = {
    VISUAL: "Berikan feedback dengan analogi visual atau contoh konkret.",
    TEXTUAL: "Berikan feedback dengan penjelasan teori yang terstruktur.",
    EXAMPLE_HEAVY: "Berikan feedback dengan contoh serupa untuk pemahaman.",
    SOCRATIC: "Berikan feedback dalam bentuk pertanyaan pemantik untuk refleksi.",
  };

  const styleLine = learningStyle
    ? `\nGaya belajar siswa: ${learningStyle}. ${styleInstructions[learningStyle] || ""}`
    : "";

  const prompt = `Kamu adalah evaluator jawaban siswa SMA/SMK.

SOAL:
${question}

JAWABAN YANG BENAR:
${correctAnswer}

JAWABAN SISWA:
${studentAnswer}

${conceptName ? `KONSEP: ${conceptName}` : ""}${styleLine}

Evaluasi jawaban siswa. Berikan:
1. isCorrect (boolean) - apakah jawaban siswa benar secara konsep
2. feedback (string) - umpan balik dalam Bahasa Indonesia, kasual dan supportif. Sesuaikan dengan gaya belajar siswa jika ada.
3. explanation (string) - penjelasan mengapa benar/salah, dalam Bahasa Indonesia
4. mastered (boolean) - apakah siswa sudah menguasai konsep ini

ATURAN:
- Jangan judge siswa kalau salah, bantu mereka paham
- Gunakan bahasa Indonesia kasual yang ramah (pake "kamu", "aku")
- Berikan contoh atau analogi jika relevan
-akhiri dengan motivasi

Jawab dalam format JSON.`;

  const { text } = await generateText({
    model: chatModel,
    system:
      "Kamu adalah asisten evaluasi pembelajaran yang membantu guru mengevaluasi jawaban siswa. Jawab selalu dalam Bahasa Indonesia.",
    prompt,
  });

  try {
    const result = safeParseJson(text);
    if (typeof result !== "object" || result === null) {
      throw new Error("AI returned non-object JSON");
    }
    const obj = result as Record<string, unknown>;
    return {
      isCorrect: Boolean(obj.isCorrect),
      feedback: typeof obj.feedback === "string" ? obj.feedback : "Evaluasi selesai.",
      explanation: typeof obj.explanation === "string" ? obj.explanation : "",
      mastered: Boolean(obj.mastered),
    };
  } catch {
    // BUG-9 FIX: Return aiFailed flag so caller knows this isn't a real evaluation.
    // Don't mark as incorrect — the answer might actually be correct.
    return {
      isCorrect: false,
      feedback: "Maaf, terjadi kesalahan saat mengevaluasi jawaban. Coba lagi ya!",
      explanation: "Sistem evaluasi sedang bermasalah. Jawabanmu belum dinilai.",
      mastered: false,
      aiFailed: true,
    };
  }
}
