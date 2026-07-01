"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clearSession, setSession, type SessionUser } from "@/lib/session";
import { sanitizeInternalPath } from "@/lib/auth-utils";
import { checkRateLimitAsync, clearRateLimit } from "@/lib/rate-limit";

const SMART_LANDING = "/auth/redirect";

export type AuthActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

const credentialsSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
  callbackUrl: z.string().optional(),
});

const studentRegisterSchema = z.object({
  role: z.literal("STUDENT"),
  name: z.string().min(2, "Nama minimal 2 karakter").max(60),
  email: z.string().email("Format email tidak valid"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(72, "Password maksimal 72 karakter"),
});

const parentRegisterSchema = z.object({
  role: z.literal("PARENT"),
  name: z.string().min(2, "Nama minimal 2 karakter").max(60),
  email: z.string().email("Format email tidak valid"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(72, "Password maksimal 72 karakter"),
  inviteCode: z
    .string()
    .min(4, "Kode undangan minimal 4 karakter")
    .max(32, "Kode undangan maksimal 32 karakter"),
});

const registerSchema = z.discriminatedUnion("role", [
  studentRegisterSchema,
  parentRegisterSchema,
]);

function resolveRedirectTarget(callbackUrl: string | undefined): string {
  const safe = sanitizeInternalPath(callbackUrl);
  return safe ?? SMART_LANDING;
}

function makeSessionUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isOnboarded: boolean;
  image: string | null;
  sessionVersion?: number;
}): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isOnboarded: user.isOnboarded,
    image: user.image,
    sessionVersion: user.sessionVersion ?? 0,
  };
}

export async function loginAction(
  _prev: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    callbackUrl: formData.get("callbackUrl") ?? undefined,
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        email: flat.email?.[0] ?? "",
        password: flat.password?.[0] ?? "",
      },
    };
  }

  const emailStr = parsed.data.email.toLowerCase();

  // Rate limit check (async — checks DB for serverless consistency)
  if (!(await checkRateLimitAsync(`login:${emailStr}`))) {
    return {
      error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: emailStr },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      role: true,
      isOnboarded: true,
      image: true,
      sessionVersion: true,
    },
  });

  if (!user?.passwordHash) {
    return { error: "Email atau password salah. Coba dicek kembali ya." };
  }

  const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!isValid) {
    return { error: "Email atau password salah. Coba dicek kembali ya." };
  }

  // Clear rate limit on successful login
  clearRateLimit(`login:${emailStr}`);

  await setSession(makeSessionUser(user));
  return {};
}

export async function registerAction(
  _prev: AuthActionState | undefined,
  formData: FormData,
): Promise<AuthActionState> {
  const raw = {
    role: formData.get("role"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    inviteCode: formData.get("inviteCode") ?? undefined,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    const fieldErrors: Record<string, string> = {};
    if (flat.name?.[0]) fieldErrors.name = flat.name[0];
    if (flat.email?.[0]) fieldErrors.email = flat.email[0];
    if (flat.password?.[0]) fieldErrors.password = flat.password[0];
    if (flat.inviteCode?.[0]) fieldErrors.inviteCode = flat.inviteCode[0];
    return { fieldErrors };
  }

  const data = parsed.data;
  const email = data.email.toLowerCase();

  // Rate limit check (async — checks DB for serverless consistency)
  if (!(await checkRateLimitAsync(`register:${email}`))) {
    return {
      error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit.",
    };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Email sudah terdaftar. Coba masuk aja, yuk." };
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  if (data.role === "STUDENT") {
    // FIX #2: buat user dulu, baru setSession di luar — kalau setSession gagal,
    // user tetap bisa login manual. Tidak bisa wrap setSession dalam prisma.$transaction
    // karena setSession butuh Next.js cookies() context.
    const user = await prisma.user.create({
      data: {
        email,
        name: data.name,
        passwordHash,
        image: `https://api.dicebear.com/9.x/pixel-art/png?seed=${(data.name?.charAt(0) || email.charAt(0)).toLowerCase()}`,
        role: "STUDENT",
        studentProfile: { create: {} },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isOnboarded: true,
        image: true,
        sessionVersion: true,
      },
    });
    clearRateLimit(`register:${email}`);
    await setSession(makeSessionUser(user));
  } else {
    const link = await prisma.parentStudentLink.findUnique({
      where: { inviteCode: data.inviteCode },
      include: { student: { select: { id: true, isOnboarded: true } } },
    });

    if (!link) {
      return {
        fieldErrors: {
          inviteCode: "Kode undangan nggak ketemu. Coba cek lagi, ya.",
        },
      };
    }
    if (link.status !== "PENDING") {
      return {
        fieldErrors: {
          inviteCode:
            link.status === "ACCEPTED"
              ? "Kode ini udah dipakai. Minta kode baru ke anak kamu."
              : "Kode ini udah nggak berlaku.",
        },
      };
    }
    if (link.expiresAt.getTime() < Date.now()) {
      return {
        fieldErrors: {
          inviteCode: "Kode udah kedaluwarsa. Minta kode baru, ya.",
        },
      };
    }

    // FIX #3: setSession dipanggil di LUAR transaction — cookie tidak boleh
    // di-set di dalam Prisma transaction callback karena kalau rollback,
    // cookie sudah terkirim ke browser untuk user yang tidak ada di DB.
    let parentUser: {
      id: string;
      email: string;
      name: string | null;
      role: string;
      isOnboarded: boolean;
      image: string | null;
      sessionVersion: number;
    };

    await prisma.$transaction(async (tx) => {
      parentUser = await tx.user.create({
        data: {
          email,
          name: data.name,
          passwordHash,
          image: `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(email)}`,
          role: "PARENT",
          parentProfile: { create: {} },
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isOnboarded: true,
          image: true,
          sessionVersion: true,
        },
      });

      await tx.parentStudentLink.update({
        where: { id: link.id },
        data: { status: "ACCEPTED", parentId: parentUser.id },
      });
    });

    clearRateLimit(`register:${email}`);
    await setSession(makeSessionUser(parentUser!));
  }

  return {};
}

export async function logoutAction(): Promise<void> {
  await clearSession();
}

export async function getIsGoogleEnabled(): Promise<boolean> {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
}
