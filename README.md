# Unified Broadcast Operating System (UBOS)

UBOS is a browser-based broadcast control platform scaffold for multi-tenant livestream production. This foundation intentionally uses mock-safe services and typed interfaces instead of real WebRTC, RTMP, OBS, OAuth, billing, or platform APIs.

## Architecture

- `apps/web` — Next.js control room, guest join, and destination settings UI.
- `apps/api` — Fastify API with route, service, repository, plugin, controller, and lib folders.
- `packages/db` — Prisma schema and a shared `prisma` client singleton.
- `packages/shared` — Domain enums, interfaces, constants, and Zod schemas.
- `packages/ui` — Shared React UI primitives and broadcast components.
- `packages/config` — Environment loading, logger placeholder, and platform constants.

## Run locally

```bash
pnpm install
cp .env.example .env
docker compose up -d postgres
pnpm db:push
pnpm ubos:start
```

### Safe web startup

`@ubos/web` uses Prisma-backed Control Room data during normal development, so
`DATABASE_URL` must exist before opening `/control-room`. Keep secrets in the
repo-root `.env` (copied from `.env.example`) and never commit real credentials.

Use one of the dotenv-backed startup scripts so the root `.env` is loaded before
Next.js starts:

```bash
pnpm ubos:start
pnpm ubos:browser
```

If you start the web app directly with `pnpm --filter @ubos/web dev`, the shared
`@ubos/db` Prisma client also checks for a repo-root `.env` from the current
working directory before constructing `PrismaClient`. It still fails fast when
`DATABASE_URL` is absent; database access is only bypassed by explicit demo/mock
mode features, not by the default Control Room path.

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Environment & database

There is a single source of truth for env vars: the root `.env` (copied from
`.env.example`). Local development uses Docker Postgres:

```
DATABASE_URL="postgresql://ubos:ubos@localhost:5432/ubos?schema=public"
```

- `pnpm dev` runs `dotenv -- turbo dev`, loading the root `.env` into the process
  so Next.js (and the API) pick up `DATABASE_URL` via `process.env`.
- Prisma CLI commands (`pnpm db:push`, `pnpm db:studio`, `pnpm db:migrate`) load
  the root `.env` via `dotenv-cli` before running Prisma in `packages/db`. They
  fail fast if `DATABASE_URL` is missing — there is no fallback value.
- Always import the shared client with `import { prisma } from '@ubos/db'`. It is
  a single hot-reload-safe singleton; never construct `new PrismaClient()`.

## Next step

Implement persistent repositories backed by Prisma while preserving the current service interfaces, then add authenticated workspace scoping.
