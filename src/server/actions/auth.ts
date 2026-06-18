"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn, signOut } from "@/lib/auth";
import { sanitizeInternalPath } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

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

  const target = resolveRedirectTarget(parsed.data.callbackUrl);

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: target,
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email atau password salah. Coba dicek kembali ya." };
    }
    throw error;
  }
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

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "Email sudah terdaftar. Coba masuk aja, yuk." };
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

    await signIn("credentials", {
      email,
      password: data.password,
      redirectTo: SMART_LANDING,
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error:
          "Akun berhasil dibuat, tapi auto-login gagal. Coba masuk manual, ya.",
      };
    }
    throw error;
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/auth/login" });
}
