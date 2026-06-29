import { NextResponse } from "next/server";
import { embed, embeddingModel } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { generateTutorStream } from "@/server/ai/tutor";
import { decrementAiQuota, incrementAiQuota } from "@/server/ai-quota";
import { buildDocumentChatContext } from "@/server/documents/features";

interface AGUIEvent {
  type: string;
  [key: string]: unknown;
}

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

  // Parse AG-UI request body
  let body: {
    messages?: Array<{
      role: string;
      content: string;
      parts?: Array<{ type: string; content: string }>;
    }>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Extract last user message from AG-UI messages array
  const lastUserMsg = [...(body.messages || [])]
    .reverse()
    .find((m) => m.role === "user");

  console.log("[stream] request received", {
    sessionId,
    userId,
    messageCount: body.messages?.length,
    hasUserMsg: !!lastUserMsg,
  });

  // Save user message to DB if it's new (check by content match)
  if (lastUserMsg) {
    const existingMsg = await prisma.chatMessage.findFirst({
      where: {
        sessionId,
        role: "USER",
        content: lastUserMsg.content,
      },
      select: { id: true },
    });

    if (!existingMsg) {
      console.log("[stream] saving user message to DB", {
        sessionId,
        contentLength: lastUserMsg.content.length,
      });
      await prisma.chatMessage.create({
        data: {
          sessionId,
          role: "USER",
          content: lastUserMsg.content,
        },
      });
    }
  }

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
    console.warn("[stream] quota exceeded", {
      sessionId,
      userId,
      current: quota.current,
      limit: quota.limit,
    });
    // Return AG-UI RUN_ERROR event instead of plain 429
    const errorStream = createAGUIStream(function* () {
      yield aguiEvent({
        type: "RUN_ERROR",
        message: "Kuota AI chat harian sudah habis. Coba lagi besok ya!",
      });
    });
    return new NextResponse(errorStream, {
      status: 200, // Must be 200 for SSE to work
      headers: sseHeaders(),
    });
  }

  console.log("[stream] quota ok", {
    sessionId,
    userId,
    current: quota.current,
    limit: quota.limit,
  });

  if (!chatSession) {
    console.warn("[stream] session not found", { sessionId, userId });
    await decrementAiQuota(userId, "chat", 1);
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const dbMessages = chatSession.messages;
  const lastDbMessage = dbMessages[dbMessages.length - 1];
  if (!lastDbMessage || lastDbMessage.role !== "USER") {
    console.warn("[stream] no user message to respond to", {
      sessionId,
      lastRole: lastDbMessage?.role,
    });
    await decrementAiQuota(userId, "chat", 1);
    const errorStream = createAGUIStream(function* () {
      yield aguiEvent({
        type: "RUN_ERROR",
        message: "No user message to respond to",
      });
    });
    return new NextResponse(errorStream, {
      status: 200,
      headers: sseHeaders(),
    });
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
      const result = await embed({
        model: embeddingModel,
        value: lastDbMessage.content,
      });
      queryEmbedding = result.embedding;
      const { context, hasContext } = await buildDocumentChatContext(
        linkedDoc.id,
        lastDbMessage.content,
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

  // Build messages array for tutor
  const messages = [
    ...(documentContext
      ? [{ role: "system" as const, content: documentContext }]
      : []),
    ...dbMessages.map((m) => ({
      role: m.role.toLowerCase() as "user" | "assistant" | "system",
      content: m.content,
    })),
  ];

  // Create AG-UI streaming response
  let fullResponse = "";
  const runId = crypto.randomUUID();
  const messageId = crypto.randomUUID();

  const stream = createAGUIStream(async function* () {
    // RUN_STARTED
    const runEvent = aguiEvent({
      type: "RUN_STARTED",
      runId,
      threadId: sessionId,
    });
    console.log("[stream] emitting:", runEvent.type);
    yield runEvent;

    try {
      const result = await generateTutorStream({
        userId,
        userName: user?.name ?? undefined,
        messages,
        subjectSlug: subjectSlug ?? undefined,
        topicId: chatSession.topicId ?? undefined,
        lastUserMessage: lastDbMessage.content,
        queryEmbedding,
        hasDocumentContext: !!documentContext,
      });

      // TEXT_MESSAGE_START
      const startEvent = aguiEvent({
        type: "TEXT_MESSAGE_START",
        messageId,
        role: "assistant",
      });
      console.log("[stream] emitting:", startEvent.type);
      yield startEvent;

      // Stream content chunks
      for await (const chunk of result.textStream) {
        if (request.signal.aborted) break;
        fullResponse += chunk;
        yield aguiEvent({
          type: "TEXT_MESSAGE_CONTENT",
          messageId,
          delta: chunk,
        });
      }
      console.log("[stream] stream done, total length:", fullResponse.length);

      // If aborted, restore quota and bail without saving
      if (request.signal.aborted) {
        if (fullResponse) {
          await decrementAiQuota(userId, "chat", 1).catch((err) =>
            console.error(
              "[stream] quota restore failed on partial abort:",
              err,
            ),
          );
        }
        yield aguiEvent({ type: "RUN_ERROR", message: "Request aborted" });
        return;
      }

      // TEXT_MESSAGE_END
      const endEvent = aguiEvent({ type: "TEXT_MESSAGE_END", messageId });
      console.log("[stream] emitting:", endEvent.type);
      yield endEvent;

      // Save full response to database
      console.log("[stream] saving response to DB", {
        sessionId,
        responseLength: fullResponse.length,
      });
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

      // RUN_FINISHED
      yield aguiEvent({
        type: "RUN_FINISHED",
        runId,
        threadId: sessionId,
        finishReason: "stop",
      });
    } catch (err) {
      // Restore quota on error
      console.error("[stream] error during streaming", {
        sessionId,
        userId,
        error: err instanceof Error ? err.message : String(err),
      });
      await decrementAiQuota(userId, "chat", 1).catch((err) =>
        console.error("[stream] quota restore failed on error:", err),
      );
      yield aguiEvent({
        type: "RUN_ERROR",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  });

  return new NextResponse(stream, {
    status: 200,
    headers: sseHeaders(),
  });
}

function sseHeaders(): HeadersInit {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };
}

function aguiEvent(event: AGUIEvent): AGUIEvent {
  return { ...event, timestamp: Date.now() };
}

function createAGUIStream(
  generator: () => AsyncGenerator<AGUIEvent> | Generator<AGUIEvent>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of generator()) {
          const encoded = `data: ${JSON.stringify(event)}\n\n`;
          console.log(
            "[stream] SSE write:",
            event.type,
            encoded.length,
            "bytes",
          );
          controller.enqueue(encoder.encode(encoded));
        }
        console.log("[stream] generator done, closing stream");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("[stream] generator error:", errorMessage);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "RUN_ERROR", message: errorMessage, timestamp: Date.now() })}\n\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });
}
