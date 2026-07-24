# AGENTS.md

## Cursor Cloud specific instructions

UBOS is a pnpm + Turbo monorepo (Node 22, pnpm 10.28.1). The startup update script
runs `pnpm install`, ensures a root `.env` exists, and runs `pnpm db:generate`.
Standard commands live in `README.md` and `package.json` — prefer those. The notes
below are non-obvious caveats for this environment.

### Services

- `@ubos/web` — Next.js Control Room UI on port 3000. Start with `pnpm ubos:start`
  (this is `dotenv -- turbo dev --filter=@ubos/web`; it loads the root `.env`).
  Do NOT start it with a bare `next dev`, or `DATABASE_URL` won't be loaded.
- `@ubos/api` — Fastify API on port 4000 (`API_PORT`). Its own `dev` script does
  not load `.env`, so run it via dotenv:
  `pnpm exec dotenv -- pnpm --filter @ubos/api dev`. Health check: `GET /health`
  returns `{"ok":true,"service":"ubos-api"}`. API services are in-memory/mock by
  design (no DB writes) — see `apps/api/src/services`.
- PostgreSQL — required for Prisma (`packages/db`). Postgres is installed but NOT
  auto-started on a fresh pod. Start it and confirm the `ubos` role/db exist:
  - `sudo pg_ctlcluster 16 main start`
  - Role/db (idempotent): `ubos`/`ubos` owning database `ubos`, matching
    `DATABASE_URL` in `.env.example`
    (`postgresql://ubos:ubos@localhost:5432/ubos?schema=public`).
  - Sync schema (not run by the update script): `pnpm db:push`.
  Docker is NOT available here, so `docker compose up postgres` from the README
  will not work — use the native cluster above instead.

### Checks (see `package.json`)

- `pnpm typecheck` and `pnpm test` pass.
- `pnpm lint` and `pnpm build` currently FAIL on a pre-existing code issue (not an
  environment problem): `apps/web/app/control-room/chrome/UbosGlobalTopBar.tsx`
  has an inline `// eslint-disable-next-line react-hooks/exhaustive-deps`, but the
  root flat ESLint config (`eslint.config.mjs`) does not register the
  `react-hooks` plugin, so ESLint errors with "rule not found". `next build` runs
  the same lint gate, so the web production build fails too. Development mode
  (`pnpm ubos:start` / `next dev`) does NOT run this gate and works fine.

### Desktop app (Tauri) — out of scope for web/API dev

`apps/desktop` builds a native Tauri binary via `cargo build`. It needs Rust
>= 1.85 (the crate tree requires Cargo `edition2024`; the preinstalled toolchain
is 1.83) plus system WebKitGTK/GTK dev libraries. `pnpm build` includes it and
will fail without those. The desktop `dev`/`desktop:demo` scripts just run the web
app. Build the rest of the repo with `pnpm build --filter=!@ubos/desktop`.
