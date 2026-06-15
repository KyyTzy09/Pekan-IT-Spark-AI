import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email dan password wajib diisi" },
        { status: 400 },
      );
    }

    const emailStr = email.toString().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email: emailStr },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Email sudah terdaftar" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password.toString(), 12);

    await prisma.user.create({
      data: {
        email: emailStr,
        name: name?.toString() || null,
        passwordHash,
        role: "STUDENT",
        studentProfile: { create: {} },
      },
    });

    return NextResponse.json(
      { message: "Registrasi berhasil" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}
