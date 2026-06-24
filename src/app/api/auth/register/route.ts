import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/session";

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
      const user = await prisma.user.create({
        data: {
          email,
          name: data.name,
          passwordHash,
          image: `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(email)}`,
          role: "STUDENT",
          studentProfile: { create: {} },
        },
        select: { id: true, email: true, name: true, role: true, isOnboarded: true, image: true, sessionVersion: true },
      });

      // Set session agar langsung login (konsisten dengan server action)
      await setSession({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isOnboarded: user.isOnboarded,
        image: user.image,
        sessionVersion: user.sessionVersion,
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

      // Wrap in transaction untuk mencegah orphan parent account
      await prisma.$transaction(async (tx) => {
        const parent = await tx.user.create({
          data: {
            email,
            name: data.name,
            passwordHash,
            image: `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(email)}`,
            role: "PARENT",
            parentProfile: { create: {} },
          },
          select: { id: true, email: true, name: true, role: true, isOnboarded: true, image: true, sessionVersion: true },
        });

        await tx.parentStudentLink.update({
          where: { id: link.id },
          data: {
            status: "ACCEPTED",
            parentId: parent.id,
          },
        });

        await setSession({
          id: parent.id,
          email: parent.email,
          name: parent.name,
          role: parent.role,
          isOnboarded: parent.isOnboarded,
          image: parent.image,
          sessionVersion: parent.sessionVersion,
        });
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
