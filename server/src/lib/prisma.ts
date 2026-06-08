import { PrismaClient } from "@prisma/client";
import { isProd } from "../config/env";

/**
 * Single shared Prisma client. In dev, reuse across hot-reloads to avoid
 * exhausting the connection pool.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProd ? ["error"] : ["warn", "error"],
  });

if (!isProd) globalForPrisma.prisma = prisma;
