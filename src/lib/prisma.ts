import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

type GlobalPrismaCache = {
  prisma?: PrismaClient;
  pgPool?: pg.Pool;
};

const globalForPrisma = globalThis as unknown as GlobalPrismaCache;

const getPgPool = () => {
  if (!globalForPrisma.pgPool) {
    globalForPrisma.pgPool = new pg.Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return globalForPrisma.pgPool;
};

const createPrismaClient = () => {
  const pool = getPgPool();
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

