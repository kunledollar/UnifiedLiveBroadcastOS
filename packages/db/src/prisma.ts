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

export const prisma: PrismaClient = globalForPrisma.prisma ?? new PrismaClient();

const nodeEnv = (globalThis as unknown as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV;
if (nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma;
}
