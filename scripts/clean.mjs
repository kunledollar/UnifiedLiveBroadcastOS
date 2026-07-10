import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const targets = ['apps/web/.next', '.turbo', 'node_modules/.cache'];

await Promise.all(
  targets.map(async (target) => {
    const absolutePath = resolve(process.cwd(), target);
    await rm(absolutePath, { recursive: true, force: true });
    console.log(`Removed ${target}`);
  }),
);
