import "server-only";

import { chatModel, generateText } from "@/lib/ai";

interface EvaluationResult {
  isCorrect: boolean;
  feedback: string;
  explanation: string;
  mastered: boolean;
}

export async function evaluateAnswer(
  question: string,
  correctAnswer: string,
  studentAnswer: string,
  questionType: string,
  conceptName?: string,
): Promise<EvaluationResult> {
  console.log("[AI_SERVICE] evaluateAnswer start", {
    questionType,
    studentAnswer,
  });
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

  const prompt = `Kamu adalah evaluator jawaban siswa SMA/SMK.

SOAL:
${question}

JAWABAN YANG BENAR:
${correctAnswer}

JAWABAN SISWA:
${studentAnswer}

${conceptName ? `KONSEP: ${conceptName}` : ""}

Evaluasi jawaban siswa. Berikan:
1. isCorrect (boolean) - apakah jawaban siswa benar secara konsep
2. feedback (string) - umpan balik dalam Bahasa Indonesia, kasual dan supportif
3. explanation (string) - penjelasan mengapa benar/salah, dalam Bahasa Indonesia
4. mastered (boolean) - apakah siswa sudah menguasai konsep ini

Jawab dalam format JSON.`;

  const { text } = await generateText({
    model: chatModel,
    system:
      "Kamu adalah asisten evaluasi pembelajaran yang membantu guru mengevaluasi jawaban siswa. Jawab selalu dalam Bahasa Indonesia.",
    prompt,
  });

  try {
    const result = JSON.parse(text);
    return {
      isCorrect: result.isCorrect,
      feedback: result.feedback,
      explanation: result.explanation,
      mastered: result.mastered,
    };
  } catch {
    return {
      isCorrect: false,
      feedback: "Maaf, terjadi kesalahan saat mengevaluasi jawaban.",
      explanation: "Silakan coba lagi atau tanyakan ke Spark.",
      mastered: false,
    };
  }
}
