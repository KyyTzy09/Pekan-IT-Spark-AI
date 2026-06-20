import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    {
      id: "credentials",
      name: "Credentials",
      type: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize({ email, password }) {
        if (!email || !password) return null;

        const emailStr = email.toString().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email: emailStr },
        });

        if (!user?.passwordHash) return null;

        const isValid = await bcrypt.compare(
          password.toString(),
          user.passwordHash,
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image:
            user.image ??
            `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(user.email)}`,
          isOnboarded: user.isOnboarded,
        };
      },
    },
    ...authConfig.providers.filter((p) => p.id !== "credentials"),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user?.id) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "STUDENT";
        token.isOnboarded = Boolean(
          (user as { isOnboarded?: boolean }).isOnboarded,
        );
        return token;
      }

      if (token.id && (trigger === "update" || !token.role)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, isOnboarded: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.isOnboarded = dbUser.isOnboarded;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = (token.role as string) ?? "STUDENT";
        session.user.isOnboarded = Boolean(token.isOnboarded);
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const email = user.email.toLowerCase();
        const existing = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });
        if (!existing) {
          const defaultAvatar = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(email)}`;
          await prisma.user.create({
            data: {
              email,
              name: user.name ?? null,
              image: user.image ?? defaultAvatar,
              role: "STUDENT",
              studentProfile: { create: {} },
            },
          });
        } else {
          await prisma.user.update({
            where: { id: existing.id },
            data: {
              image: user.image ?? undefined,
              name: user.name ?? undefined,
            },
          });
        }
      }
      return true;
    },
  },
});

export const getServerAuthSession = auth;
export { isGoogleEnabled } from "./auth.config";
