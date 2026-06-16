"use client";

import { ChallengeMaterialView } from "./challenge-material-view";
import { ChallengeQuestionForm } from "./challenge-question-form";
import { ChallengeReflectionForm } from "./challenge-reflection-form";

type ChallengeItemStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";
type ChallengeItemKind = "QUESTION" | "MATERIAL" | "REFLECTION";

interface ChallengeDetailItem {
  id: string;
  order: number;
  kind: ChallengeItemKind;
  status: ChallengeItemStatus;
  points: number;
  prompt: string | null;
  answer: string | null;
  isCorrect: boolean | null;
  question: {
    id: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation: string | null;
    hint: string | null;
    difficulty: "EASY" | "MEDIUM" | "HARD" | "ADVANCED";
    conceptName: string;
    topicName: string;
  } | null;
  material: {
    id: string;
    title: string;
    content: string;
    keyPoints: string[];
    estimatedMinutes: number;
    difficulty: "EASY" | "MEDIUM" | "HARD" | "ADVANCED";
  } | null;
}

interface ChallengeItemRendererProps {
  item: ChallengeDetailItem;
  challengeId: string;
  onCompleteItem: (
    itemId: string,
    answer?: string,
  ) => Promise<{
    ok: boolean;
    isCorrect?: boolean;
    correctAnswer?: string;
    explanation?: string | null;
    error?: string;
  }>;
  onSkipItem: (itemId: string) => Promise<{ ok: boolean; error?: string }>;
  onSubmitReflection: (
    challengeId: string,
    response: string,
  ) => Promise<{
    ok: boolean;
    analysis?: { sentiment: string; depth: string; suggestions: string[] };
    error?: string;
  }>;
  onMarkMaterialRead: (
    materialId: string,
    readSeconds: number,
    completed: boolean,
  ) => Promise<void>;
}

export function ChallengeItemRenderer({
  item,
  challengeId,
  onCompleteItem,
  onSkipItem,
  onSubmitReflection,
  onMarkMaterialRead,
}: ChallengeItemRendererProps) {
  if (item.kind === "QUESTION" && item.question) {
    return (
      <ChallengeQuestionForm
        itemId={item.id}
        status={item.status}
        question={item.question}
        prefillAnswer={item.answer}
        prefillIsCorrect={item.isCorrect}
        onComplete={onCompleteItem}
        onSkip={onSkipItem}
      />
    );
  }
  if (item.kind === "MATERIAL" && item.material) {
    return (
      <ChallengeMaterialView
        itemId={item.id}
        status={item.status}
        material={item.material}
        onComplete={async (id) => onCompleteItem(id)}
        onSkip={onSkipItem}
        onMarkRead={onMarkMaterialRead}
      />
    );
  }
  if (item.kind === "REFLECTION" && item.prompt) {
    return (
      <ChallengeReflectionForm
        itemId={item.id}
        status={item.status}
        challengeId={challengeId}
        prompt={item.prompt}
        existingResponse={item.answer}
        onSubmit={onSubmitReflection}
        onSkip={onSkipItem}
      />
    );
  }
  return (
    <p className="text-[12.5px] text-muted-foreground">
      Item ini belum tersedia.
    </p>
  );
}
