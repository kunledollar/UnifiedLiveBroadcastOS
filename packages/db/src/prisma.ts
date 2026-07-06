import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

// Load repository-root env defaults before Prisma is constructed. This keeps
// direct @ubos/web startup working without hardcoding secrets: values already
// provided by the environment always win, the root .env is preferred, and the
// checked-in .env.example is used only for non-production local development.
function loadRootEnv() {
  let current = typeof process.cwd === 'function' ? process.cwd() : dirname(fileURLToPath(import.meta.url));
  const { root } = parse(current);

  while (true) {
    const packageJsonPath = join(current, 'package.json');
    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { name?: string };
        if (packageJson.name === 'ubos') {
          const rootEnvPath = join(current, '.env');
          if (existsSync(rootEnvPath)) {
            loadEnvFile(rootEnvPath);
          } else if (process.env.NODE_ENV !== 'production') {
            loadEnvFile(join(current, '.env.example'));
          }
          return;
        }
      } catch {
        // Ignore malformed package metadata and keep walking upward.
      }
    }

    if (current === root) return;
    current = dirname(current);
  }
}

function loadEnvFile(envPath: string) {
  if (!existsSync(envPath)) return;

  const contents = readFileSync(envPath, 'utf8');
  for (const line of contents.split(/\r?\n/u)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?\s*$/u.exec(line);
    if (!match) continue;

    const key = match[1];
    if (!key || process.env[key] !== undefined) continue;

    const rawValue = match[2] ?? '';
    const value = rawValue.trim().replace(/^(['"])(.*)\1$/u, '$2');
    process.env[key] = value;
  }
}

loadRootEnv();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

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

const nodeEnv = (globalThis as unknown as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV;
if (nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
}
