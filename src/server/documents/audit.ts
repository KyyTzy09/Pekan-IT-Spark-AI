import "server-only";

import { prisma } from "@/lib/prisma";
import type {
  DocumentAuditAction,
  Prisma,
} from "../../../generated/prisma/client";

export async function logDocumentEvent(input: {
  documentId: string;
  userId: string;
  action: DocumentAuditAction;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.documentAuditLog.create({
      data: {
        documentId: input.documentId,
        userId: input.userId,
        action: input.action,
        metadata: (input.metadata ?? null) as Prisma.InputJsonValue,
      },
    });
  } catch (e) {
    console.warn("document audit log failed:", e);
  }
}
