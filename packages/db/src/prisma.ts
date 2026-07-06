import type { PrismaClient as PrismaClientType } from '@prisma/client';

type FsLike = { existsSync(path: string): boolean; readFileSync(path: string, encoding: 'utf8'): string };
type PathLike = { dirname(path: string): string; join(...paths: string[]): string; resolve(path: string): string };
type ProcessLike = { cwd(): string; env: Record<string, string | undefined>; getBuiltinModule?: (id: string) => unknown };
declare const process: ProcessLike;

const ENV_ASSIGNMENT = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/;

function parseEnvValue(value: string) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed.replace(/\s+#.*$/, '');
}

function getBuiltin<T>(id: string): T {
  return (process.getBuiltinModule?.(id) ?? Function(`return import(${JSON.stringify(id)})`)()) as T;
}

function applyDotenvFile(fs: FsLike, path: string) {
  for (const line of fs.readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = line.match(ENV_ASSIGNMENT);
    if (!match) continue;
    const key = match[1];
    const rawValue = match[2];
    if (key && rawValue !== undefined && process.env[key] === undefined) process.env[key] = parseEnvValue(rawValue);
  }
}

function findUpDotenv(fs: FsLike, path: PathLike, start: string) {
  let current = path.resolve(start);
  while (true) {
    const candidate = path.join(current, '.env');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
}

function loadDatabaseEnv() {
  if (process.env.DATABASE_URL) return;
  const fs = getBuiltin<FsLike>('fs');
  const path = getBuiltin<PathLike>('path');
  const dotenvPath = findUpDotenv(fs, path, process.cwd());
  if (dotenvPath) applyDotenvFile(fs, dotenvPath);
}

loadDatabaseEnv();

const { PrismaClient } = await import('@prisma/client');

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientType };

export const prisma: PrismaClientType = globalForPrisma.prisma ?? new PrismaClient();

// Cache on globalThis in development so hot reloading reuses one client
// instead of opening a new connection pool on every change.
const nodeEnv = (globalThis as unknown as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV;
if (nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
}
