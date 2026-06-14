import { createTRPCRouter, protectedProcedure, baseProcedure } from "../init";

export const authRouter = createTRPCRouter({
  getSession: baseProcedure.query(async ({ ctx }) => {
    return ctx.session;
  }),

  getProtectedMessage: protectedProcedure.query(async ({ ctx }) => {
    return { message: `Hello user ${ctx.userId}` };
  }),
});
