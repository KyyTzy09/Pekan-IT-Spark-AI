"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { generateChatTitle, generateTutorStream } from "@/server/ai/tutor";
import { logDocumentEvent } from "@/server/documents/audit";
import { buildDocumentChatContext } from "@/server/documents/features";

const createSchema = z.object({
  subjectSlug: z.string().optional(),
  topicId: z.string().optional(),
  documentId: z.string().optional(),
  firstMessage: z.string().min(1).max(2000),
});

async function requireStudent() {
  const session = await getSession();
  if (!session?.id) {
    throw new Error("UNAUTHORIZED");
  }
  if (session.role !== "STUDENT") {
    throw new Error("FORBIDDEN");
  }
  return session.id;
}

export type ChatSessionSummary = {
  id: string;
  title: string;
  subjectId: string | null;
  subjectName: string | null;
  subjectSlug: string | null;
  topicId: string | null;
  topicName: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
  messageCount: number;
  preview: string | null;
};

export async function listChatSessions(): Promise<ChatSessionSummary[]> {
  const userId = await requireStudent();
  const sessions = await prisma.chatSession.findMany({
    where: { userId, isActive: true },
    orderBy: { updatedAt: "desc" },
    take: 30,
    include: {
      subject: { select: { id: true, name: true, slug: true } },
      topic: { select: { id: true, name: true } },
      _count: { select: { messages: true } },
    },
  });

  const lastMessages = await prisma.chatMessage.findMany({
    where: {
      sessionId: { in: sessions.map((s) => s.id) },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      sessionId: true,
      content: true,
      role: true,
      createdAt: true,
    },
  });

  const lastBySession = new Map<string, (typeof lastMessages)[number]>();
  for (const m of lastMessages) {
    if (!lastBySession.has(m.sessionId)) {
      lastBySession.set(m.sessionId, m);
    }
  }

  return sessions.map((s) => {
    const last = lastBySession.get(s.id);
    return {
      id: s.id,
      title: s.title,
      subjectId: s.subject?.id ?? null,
      subjectName: s.subject?.name ?? null,
      subjectSlug: s.subject?.slug ?? null,
      topicId: s.topic?.id ?? null,
      topicName: s.topic?.name ?? null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      lastMessageAt: last?.createdAt.toISOString() ?? null,
      messageCount: s._count.messages,
      preview: last?.role === "USER" ? last.content.slice(0, 80) : null,
    };
  });
}

export type ChatSessionDetail = {
  id: string;
  userId: string;
  title: string;
  subjectId: string | null;
  topicId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  subject: { id: string; name: string; slug: string } | null;
  topic: { id: string; name: string } | null;
};

export async function getChatSession(
  sessionId: string,
): Promise<ChatSessionDetail | null> {
  const userId = await requireStudent();
  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      subject: { select: { id: true, name: true, slug: true } },
      topic: { select: { id: true, name: true } },
    },
  });
  return session as ChatSessionDetail | null;
}

export async function getChatMessages(sessionId: string): Promise<
  Array<{
    id: string;
    role: "USER" | "ASSISTANT" | "SYSTEM";
    content: string;
    createdAt: string;
  }>
> {
  const userId = await requireStudent();
  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
    select: { id: true },
  });
  if (!session) return [];
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, content: true, createdAt: true },
  });
  return messages.map((m) => ({
    id: m.id,
    role: m.role as "USER" | "ASSISTANT" | "SYSTEM",
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  }));
}

export async function startNewChat(input: {
  subjectSlug?: string;
  topicId?: string;
  documentId?: string;
  firstMessage: string;
}): Promise<{ sessionId: string }> {
  const userId = await requireStudent();
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Input tidak valid");
  }

  const subject = parsed.data.subjectSlug
    ? await prisma.subject.findUnique({
        where: { slug: parsed.data.subjectSlug as never },
        select: { id: true, slug: true },
      })
    : null;
  const topic = parsed.data.topicId
    ? await prisma.topic.findUnique({
        where: { id: parsed.data.topicId },
        select: { id: true },
      })
    : null;

  let document = null;
  if (parsed.data.documentId) {
    document = await prisma.document.findFirst({
      where: { id: parsed.data.documentId, userId },
      select: { id: true, originalName: true },
    });
  }

  const baseTitle = document
    ? `Diskusi: ${document.originalName}`
    : parsed.data.firstMessage;
  const title = await generateChatTitle(baseTitle);

  const created = await prisma.chatSession.create({
    data: {
      userId,
      title,
      subjectId: subject?.id ?? null,
      topicId: topic?.id ?? null,
      messages: {
        create: {
          role: "USER",
          content: parsed.data.firstMessage,
        },
      },
    },
    select: { id: true },
  });

  if (document) {
    await prisma.document.update({
      where: { id: document.id },
      data: { chatSessionId: created.id },
    });
  }

  revalidatePath("/chat");
  return { sessionId: created.id };
}

export async function generateAssistantResponse(
  sessionId: string,
): Promise<void> {
  const userId = await requireStudent();
  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      documents: { select: { id: true, originalName: true }, take: 1 },
    },
  });
  if (!session) {
    throw new Error("Chat session not found");
  }

  // If the last message is already from assistant, skip to prevent double generation
  const lastMessage = session.messages[session.messages.length - 1];
  if (!lastMessage || lastMessage.role === "ASSISTANT") {
    return;
  }

  const subjectSlug = session.subjectId
    ? (
        await prisma.subject.findUnique({
          where: { id: session.subjectId },
          select: { slug: true },
        })
      )?.slug
    : undefined;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const linkedDoc = session.documents[0];
  let documentContext: string | null = null;
  if (linkedDoc) {
    try {
      const { context, hasContext } = await buildDocumentChatContext(
        linkedDoc.id,
        lastMessage.content,
        4,
      );
      if (hasContext) {
        documentContext = `DOKUMEN YANG DIBICARAKAN: "${linkedDoc.originalName}"\n\n${context}\n\nATURAN: 
- Jawab pertanyaan berdasarkan cuplikan di atas. Kalau ga ada jawabannya di cuplikan, bilang "Aku ga nemu jawabannya di dokumenmu" — jangan ngarang dari luar.
- Gunakan metode Socratic: jangan kasih jawaban final langsung untuk soal/ujian. Bimbing dengan pertanyaan probing.
- Selalu akhiri dengan pertanyaan terbuka untuk lanjutin dialog.`;
      }
    } catch (e) {
      console.warn("buildDocumentChatContext failed:", e);
    }
  }

  const messages = [
    ...(documentContext
      ? [{ role: "system" as const, content: documentContext }]
      : []),
    ...session.messages.map((m) => ({
      role: m.role.toLowerCase() as "user" | "assistant" | "system",
      content: m.content,
    })),
  ];

  const result = await generateTutorStream({
    userId,
    userName: user?.name ?? undefined,
    messages,
    subjectSlug: subjectSlug ?? undefined,
    topicId: session.topicId ?? undefined,
    lastUserMessage: lastMessage.content,
  });

  const fullText = await result.text;

  await prisma.$transaction([
    prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "ASSISTANT",
        content: fullText,
      },
    }),
    prisma.chatSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date() },
    }),
  ]);

  revalidatePath("/chat");
  revalidatePath(`/chat/${session.id}`);
  revalidatePath("/dashboard");
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  const userId = await requireStudent();
  await prisma.chatSession.deleteMany({
    where: { id: sessionId, userId },
  });
  revalidatePath("/chat");
  revalidatePath(`/chat/${sessionId}`);
  redirect("/chat");
}

export type StreamResult = {
  text: AsyncIterable<string>;
  sessionId: string;
  documentName?: string;
};

export async function sendMessage(input: {
  sessionId: string;
  content: string;
}): Promise<StreamResult> {
  const userId = await requireStudent();
  if (!input.content.trim()) {
    throw new Error("Pesan kosong");
  }

  const session = await prisma.chatSession.findFirst({
    where: { id: input.sessionId, userId },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 20 },
      documents: { select: { id: true, originalName: true }, take: 1 },
    },
  });
  if (!session) {
    throw new Error("Chat session not found");
  }

  await prisma.chatMessage.create({
    data: {
      sessionId: session.id,
      role: "USER",
      content: input.content,
    },
  });

  const subjectSlug = session.subjectId
    ? (
        await prisma.subject.findUnique({
          where: { id: session.subjectId },
          select: { slug: true },
        })
      )?.slug
    : undefined;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const linkedDoc = session.documents[0];
  let documentContext: string | null = null;
  let documentName: string | null = null;
  if (linkedDoc) {
    documentName = linkedDoc.originalName;
    try {
      const { context, hasContext } = await buildDocumentChatContext(
        linkedDoc.id,
        input.content,
        4,
      );
      if (hasContext) {
        documentContext = `DOKUMEN YANG DIBICARAKAN: "${linkedDoc.originalName}"\n\n${context}\n\nATURAN: 
- Jawab pertanyaan berdasarkan cuplikan di atas. Kalau ga ada jawabannya di cuplikan, bilang "Aku ga nemu jawabannya di dokumenmu" — jangan ngarang dari luar.
- Gunakan metode Socratic: jangan kasih jawaban final langsung untuk soal/ujian. Bimbing dengan pertanyaan probing.
- Selalu akhiri dengan pertanyaan terbuka untuk lanjutin dialog.`;
        await logDocumentEvent({
          documentId: linkedDoc.id,
          userId,
          action: "RAG_QUERY",
          metadata: {
            chatSessionId: session.id,
            queryLength: input.content.length,
            hasContext,
          },
        });
      }
    } catch (e) {
      console.warn("buildDocumentChatContext failed:", e);
    }
  }

  const messages = [
    ...(documentContext
      ? [
          {
            role: "system" as const,
            content: documentContext,
          },
        ]
      : []),
    ...session.messages.map((m) => ({
      role: m.role.toLowerCase() as "user" | "assistant" | "system",
      content: m.content,
    })),
    { role: "user" as const, content: input.content },
  ];

  const result = await generateTutorStream({
    userId,
    userName: user?.name ?? undefined,
    messages,
    subjectSlug: subjectSlug ?? undefined,
    topicId: session.topicId ?? undefined,
    lastUserMessage: input.content,
  });

  const fullText = await result.text;

  await prisma.$transaction([
    prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "ASSISTANT",
        content: fullText,
      },
    }),
    prisma.chatSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date() },
    }),
  ]);

  revalidatePath("/chat");
  revalidatePath(`/chat/${session.id}`);
  revalidatePath("/dashboard");

  async function* iterator() {
    yield fullText;
  }

  return {
    sessionId: session.id,
    text: iterator(),
    ...(documentName ? { documentName } : {}),
  } as StreamResult;
}

export async function sendMessageAndNavigate(input: {
  sessionId: string;
  content: string;
}) {
  await sendMessage(input);
}
