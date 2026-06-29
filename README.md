# Unified Broadcast Operating System (UBOS)

UBOS is a browser-based broadcast control platform scaffold for multi-tenant livestream production. This foundation intentionally uses mock-safe services and typed interfaces instead of real WebRTC, RTMP, OBS, OAuth, billing, or platform APIs.

## Architecture

- `apps/web` — Next.js control room, guest join, and destination settings UI.
- `apps/api` — Fastify API with route, service, repository, plugin, controller, and lib folders.
- `packages/db` — Prisma schema for PostgreSQL.
- `packages/shared` — Domain enums, interfaces, constants, and Zod schemas.
- `packages/ui` — Shared React UI primitives and broadcast components.
- `packages/config` — Environment loading, logger placeholder, and platform constants.

## Run locally

```bash
pnpm install
cp .env.example .env
docker compose up -d postgres
pnpm --filter @ubos/db prisma:generate
pnpm dev
```

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Next step

Implement persistent repositories backed by Prisma while preserving the current service interfaces, then add authenticated workspace scoping.
