import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { embed, embeddingModel } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { generateTutorStream } from "@/server/ai/tutor";
import { decrementAiQuota, incrementAiQuota } from "@/server/ai-quota";
import { buildDocumentChatContext } from "@/server/documents/features";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const session = await getSession();
  if (!session?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const userId = session.id;

  // Parallel: quota + session + user fetch
  const [quota, chatSession, user] = await Promise.all([
    incrementAiQuota(userId, "chat", 1),
    prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        messages: { orderBy: { createdAt: "asc" }, take: 20 },
        documents: { select: { id: true, originalName: true }, take: 1 },
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    }),
  ]);

  if (!quota.allowed) {
    return NextResponse.json(
      { error: "Kuota AI chat harian sudah habis. Coba lagi besok ya!" },
      { status: 429 },
    );
  }

  if (!chatSession) {
    await decrementAiQuota(userId, "chat", 1);
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const lastMessage = chatSession.messages[chatSession.messages.length - 1];
  if (!lastMessage || lastMessage.role !== "USER") {
    await decrementAiQuota(userId, "chat", 1);
    return NextResponse.json({ error: "No user message to respond to" }, { status: 400 });
  }

  // Subject fetch (depends on chatSession.subjectId)
  const subjectSlug = chatSession.subjectId
    ? (
        await prisma.subject.findUnique({
          where: { id: chatSession.subjectId },
          select: { slug: true },
        })
      )?.slug
    : undefined;

  // Build document context if linked — embed query once, reuse for RAG
  const linkedDoc = chatSession.documents[0];
  let documentContext: string | null = null;
  let queryEmbedding: number[] | undefined;
  if (linkedDoc) {
    try {
      const result = await embed({ model: embeddingModel, value: lastMessage.content });
      queryEmbedding = result.embedding;
      const { context, hasContext } = await buildDocumentChatContext(
        linkedDoc.id,
        lastMessage.content,
        4,
        queryEmbedding,
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

  // Build messages array
  const messages = [
    ...(documentContext
      ? [{ role: "system" as const, content: documentContext }]
      : []),
    ...chatSession.messages.map((m) => ({
      role: m.role.toLowerCase() as "user" | "assistant" | "system",
      content: m.content,
    })),
  ];

  // Create streaming response
  const encoder = new TextEncoder();
  let fullResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const result = await generateTutorStream({
          userId,
          userName: user?.name ?? undefined,
          messages,
          subjectSlug: subjectSlug ?? undefined,
          topicId: chatSession.topicId ?? undefined,
          lastUserMessage: lastMessage.content,
          queryEmbedding,
          hasDocumentContext: !!documentContext,
        });

        // Stream chunks to client
        for await (const chunk of result.textStream) {
          fullResponse += chunk;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
        }

        // Save full response to database
        await prisma.$transaction([
          prisma.chatMessage.create({
            data: {
              sessionId: chatSession.id,
              role: "ASSISTANT",
              content: fullResponse,
            },
          }),
          prisma.chatSession.update({
            where: { id: chatSession.id },
            data: { updatedAt: new Date() },
          }),
        ]);

        // Send done signal
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
      } catch (err) {
        // Restore quota on error
        await decrementAiQuota(userId, "chat", 1).catch(() => {});
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`));
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
