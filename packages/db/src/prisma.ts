import { PrismaClient } from '@prisma/client';

// Single PrismaClient for the whole monorepo. It reads DATABASE_URL from
// process.env (provided by the root .env). No custom env loading and no
// fallback: if DATABASE_URL is missing, Prisma fails fast on first use.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.prisma ?? new PrismaClient();

// Cache on globalThis in development so hot reloading reuses one client
// instead of opening a new connection pool on every change.
const nodeEnv = (globalThis as unknown as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV;
if (nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
}
