import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const studentBody = z.object({
  role: z.literal("STUDENT"),
  name: z.string().min(2).max(60),
  email: z.string().email().max(120),
  password: z.string().min(8).max(72),
});

const parentBody = z.object({
  role: z.literal("PARENT"),
  name: z.string().min(2).max(60),
  email: z.string().email().max(120),
  password: z.string().min(8).max(72),
  inviteCode: z.string().min(4).max(32),
});

const bodySchema = z.discriminatedUnion("role", [studentBody, parentBody]);

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Payload tidak valid" },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      {
        message: first?.message ?? "Data tidak valid",
        field: first?.path.join("."),
      },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const email = data.email.toLowerCase();

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { message: "Email sudah terdaftar. Coba masuk aja, yuk." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    if (data.role === "STUDENT") {
      await prisma.user.create({
        data: {
          email,
          name: data.name,
          passwordHash,
          role: "STUDENT",
          studentProfile: { create: {} },
        },
      });
    } else {
      const link = await prisma.parentStudentLink.findUnique({
        where: { inviteCode: data.inviteCode },
        include: { student: { select: { id: true, isOnboarded: true } } },
      });

      if (!link) {
        return NextResponse.json(
          { message: "Kode undangan nggak ketemu. Coba cek lagi, ya." },
          { status: 404 },
        );
      }
      if (link.status !== "PENDING") {
        return NextResponse.json(
          {
            message:
              link.status === "ACCEPTED"
                ? "Kode ini udah dipakai. Minta kode baru ke anak kamu."
                : "Kode ini udah nggak berlaku.",
          },
          { status: 410 },
        );
      }
      if (link.expiresAt.getTime() < Date.now()) {
        return NextResponse.json(
          { message: "Kode udah kedaluwarsa. Minta kode baru, ya." },
          { status: 410 },
        );
      }

      const parent = await prisma.user.create({
        data: {
          email,
          name: data.name,
          passwordHash,
          role: "PARENT",
          parentProfile: { create: {} },
        },
      });

      await prisma.parentStudentLink.update({
        where: { id: link.id },
        data: {
          status: "ACCEPTED",
          parentId: parent.id,
        },
      });
    }

    return NextResponse.json(
      { message: "Registrasi berhasil", role: data.role },
      { status: 201 },
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { message: "Terjadi kesalahan server. Coba lagi, ya." },
      { status: 500 },
    );
  }
}
