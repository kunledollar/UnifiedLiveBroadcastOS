# UBOS Runtime Manager

## Current architecture and ownership

The Next.js web process owns Prisma access for the Control Room through the single `prisma` export in `@ubos/db`. `packages/db/src/prisma.ts` loads the repository root `.env` before constructing that singleton; root `pnpm dev` also loads it with `dotenv-cli`. PostgreSQL is the only runtime dependency currently started by the repository: `docker-compose.yml` owns a `postgres` service. The Fastify API has a simple `/health` endpoint and WebSocket upgrade support, but the Control Room does not depend on it for its initial data path. Redis and a deployed media engine are not configured services. FFmpeg discovery exists as a native-runtime capability, not as a Control Room startup dependency. The desktop package currently delegates development to the web process.

## Service classification

The initial Runtime Manager checks one required service: **PostgreSQL / Prisma**. This is intentionally one combined check, because a successful Prisma `SELECT 1` is the real evidence that both the shared Prisma singleton and PostgreSQL can serve saved sessions. Reporting separate green database and Prisma rows from the same probe would create a misleading health state. API, WebSocket, Redis, FFmpeg, media engine, and desktop shell are not checked because none is a required Control Room startup dependency in the present repository.

## Startup flow and states

`/control-room` asks the server Runtime Manager for health before it executes Control Room data actions. The manager shares an in-flight probe, caches a result for one second to avoid reconnect storms, and limits the Prisma `SELECT 1` probe to 2.5 seconds. It returns sanitized typed service results and an aggregate state:

- **Ready:** every required service is healthy.
- **Degraded:** core UI can continue but an optional service is unavailable. No optional runtime service is registered yet, so this is reserved for future real checks.
- **Blocked:** a required service is unavailable. The Control Room shows the Runtime Manager recovery screen instead of attempting database reads or writes.

The recovery screen supports Retry via `GET /api/runtime/health?retry=1`, shows concise diagnostics and recovery guidance, and never renders an exception or connection string. Structured logs record check start/pass/failure, retry, and aggregate transitions with fixed fields only.

## Database recovery and local development

1. Copy `.env.example` to `.env` and set `DATABASE_URL`.
2. Start the repository-owned service with `docker compose up -d postgres`.
3. Run `pnpm db:push` when schema setup is required (never from a page request).
4. Run `pnpm dev` and use Retry in the Runtime Manager.

The manager does not auto-start Docker, run migrations, create another Prisma client, or expose environment values. `pnpm dev` remains `dotenv -- turbo dev`; it starts workspace dev services once, while Docker remains an explicit cross-platform operation.

## Offline/degraded behavior and limitations

Although older page code contains demo fixtures, its Control Room actions persist to Prisma. A broad offline mode would therefore allow edits that later fail unpredictably. This release correctly blocks startup when PostgreSQL is unavailable rather than claiming offline persistence. A future offline milestone must add an explicit local repository, disabled persistence actions, a persistent offline indicator, and an intentional synchronization plan.

## Adding checks safely

Add a service only after the repository has a real owned runtime dependency. Give it a truthful probe, strict timeout, required/optional classification based on the requested operation, sanitized details, and tests for success, failure, timeout, retry, and aggregation. Never use configuration presence as proof of health; never include secrets, paths, stack traces, or complete connection strings in logs or HTTP responses.

## Production considerations

Use production-provided environment configuration, a managed PostgreSQL endpoint, and external monitoring in addition to this request-time gate. Health probes are read-only and do not replace migrations, backups, authentication, or alerting. The health endpoint is intentionally operational and sanitized; deploy it behind the same network/access policy as the web service when infrastructure topology requires that.
