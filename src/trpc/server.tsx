import "server-only";

import { createCallerFactory, createTRPCContext } from "./init";
import { appRouter } from "./routers/_app";

const createCaller = createCallerFactory(appRouter);

export const api = async () => {
  const ctx = await createTRPCContext();
  return createCaller(ctx);
};
