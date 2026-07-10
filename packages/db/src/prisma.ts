import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, parse, resolve } from 'node:path';
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
    const value = parseEnvValue(rawValue);
    process.env[key] = value;
  }
}

function parseEnvValue(value: string) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed.replace(/\s+#.*$/u, '');
}

function findUpDotenv(start: string) {
  let current = resolve(start);
  while (true) {
    const candidate = join(current, '.env');
    if (existsSync(candidate)) return candidate;
    const parent = dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
}

function loadDatabaseEnv() {
  if (process.env.DATABASE_URL) return;
  const dotenvPath = findUpDotenv(typeof process.cwd === 'function' ? process.cwd() : dirname(fileURLToPath(import.meta.url)));
  if (dotenvPath) loadEnvFile(dotenvPath);
}

loadRootEnv();
loadDatabaseEnv();

type PrismaClientType = PrismaClient;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientType };

export const prisma: PrismaClientType = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
