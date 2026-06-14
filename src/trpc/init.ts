import { initTRPC, TRPCError } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { Session } from "next-auth";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const createTRPCContext = async (
  _opts?: FetchCreateContextFnOptions,
) => {
  const session = await getServerAuthSession();
  return {
    session,
    prisma,
    userId: session?.user?.id,
  };
};

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create();

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;

const isAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.session.user.id,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthenticated);

const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (ctx.session.user.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.session.user.id,
    },
  });
});

export const adminProcedure = t.procedure.use(isAdmin);
