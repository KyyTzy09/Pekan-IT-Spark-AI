"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode(length = 8) {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

async function uniqueCode(tries = 8) {
  for (let i = 0; i < tries; i += 1) {
    const code = generateInviteCode();
    const existing = await prisma.parentStudentLink.findUnique({
      where: { inviteCode: code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  throw new Error("Gagal generate kode undangan yang unik");
}

async function requireStudent() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  if (session.user.role !== "STUDENT") {
    redirect("/");
  }
  return { userId: session.user.id };
}

export type InviteSummary = {
  inviteCode: string;
  expiresAt: string;
  status: "PENDING" | "ACCEPTED";
  parentName: string | null;
  createdAt: string;
};

export async function getActiveInvite() {
  const { userId } = await requireStudent();
  const link = await prisma.parentStudentLink.findFirst({
    where: {
      studentId: userId,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!link) return null;
  return {
    inviteCode: link.inviteCode,
    expiresAt: link.expiresAt.toISOString(),
    status: link.status,
    createdAt: link.createdAt.toISOString(),
  };
}

export async function listInvites() {
  const { userId } = await requireStudent();
  const links = await prisma.parentStudentLink.findMany({
    where: { studentId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      parent: { select: { name: true, email: true } },
    },
    take: 10,
  });
  return links.map((l) => ({
    inviteCode: l.inviteCode,
    expiresAt: l.expiresAt.toISOString(),
    status: l.status,
    parentName: l.parent?.name ?? null,
    parentEmail: l.parent?.email ?? null,
    createdAt: l.createdAt.toISOString(),
  }));
}

export async function generateInvite() {
  const { userId } = await requireStudent();
  const existing = await prisma.parentStudentLink.findFirst({
    where: {
      studentId: userId,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    select: { id: true, inviteCode: true, expiresAt: true },
  });
  if (existing) {
    return {
      ok: true as const,
      inviteCode: existing.inviteCode,
      expiresAt: existing.expiresAt.toISOString(),
    };
  }
  const code = await uniqueCode();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  const link = await prisma.parentStudentLink.create({
    data: {
      inviteCode: code,
      studentId: userId,
      status: "PENDING",
      expiresAt,
    },
  });
  return {
    ok: true as const,
    inviteCode: link.inviteCode,
    expiresAt: link.expiresAt.toISOString(),
  };
}

export async function revokeInvite() {
  const { userId } = await requireStudent();
  await prisma.parentStudentLink.updateMany({
    where: {
      studentId: userId,
      status: "PENDING",
    },
    data: { expiresAt: new Date() },
  });
  return { ok: true as const };
}

const linkSchema = z.object({
  inviteCode: z
    .string()
    .min(4, "Kode undangan minimal 4 karakter")
    .max(32, "Kode undangan maksimal 32 karakter")
    .transform((s) => s.toUpperCase()),
});

async function requireParent() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }
  if (session.user.role !== "PARENT") {
    redirect("/");
  }
  return { userId: session.user.id };
}

export type LinkResult =
  | { ok: true; studentName: string | null }
  | { ok: false; message: string };

export async function linkChildWithCode(input: unknown): Promise<LinkResult> {
  const { userId } = await requireParent();
  const parsed = linkSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Kode undangan nggak valid.",
    };
  }
  const { inviteCode } = parsed.data;

  const link = await prisma.parentStudentLink.findUnique({
    where: { inviteCode },
    include: { student: { select: { id: true, name: true } } },
  });

  if (!link) {
    return {
      ok: false,
      message: "Kode undangan nggak ketemu. Coba cek lagi, ya.",
    };
  }
  if (link.status === "ACCEPTED") {
    return {
      ok: false,
      message: "Kode ini udah dipakai. Minta kode baru ke anak kamu.",
    };
  }
  if (link.expiresAt.getTime() < Date.now()) {
    return {
      ok: false,
      message: "Kode udah kedaluwarsa. Minta kode baru, ya.",
    };
  }

  const existing = await prisma.parentStudentLink.findFirst({
    where: {
      parentId: userId,
      studentId: link.studentId,
    },
    select: { id: true, status: true },
  });
  if (existing) {
    return {
      ok: false,
      message: "Akun kamu udah terhubung sama anak ini.",
    };
  }

  await prisma.parentStudentLink.update({
    where: { id: link.id },
    data: {
      status: "ACCEPTED",
      parentId: userId,
    },
  });

  return { ok: true, studentName: link.student.name };
}
