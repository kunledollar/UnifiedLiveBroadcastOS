# UBOS v5.10.0 Release Checklist

- Release title: UBOS v5.10 Automation, Rundown, and Show-Control Platform
- Release date: 2026-07-14
- Certification source: v5.10.7 Automation Platform Certification
- Certification result: PASS
- Release tag: `v5.10.0` not created; explicit tag authorization was not provided
- Remote publication: deferred; `origin` is unavailable in this workspace

## Local validation

- PASS: `pnpm --filter @ubos/media-plane typecheck`
- PASS: `pnpm --filter @ubos/media-plane build`
- PASS: `pnpm --filter @ubos/media-plane validate:v5.10.1`
- PASS: `pnpm --filter @ubos/media-plane validate:v5.10.2`
- PASS: `pnpm --filter @ubos/media-plane validate:v5.10.3`
- PASS: `pnpm --filter @ubos/media-plane validate:v5.10.4`
- PASS: `pnpm --filter @ubos/media-plane validate:v5.10.5`
- PASS: `pnpm --filter @ubos/media-plane validate:v5.10.6`
- PASS: `pnpm --filter @ubos/media-plane validate:v5.10.7`
- PASS: `pnpm --filter @ubos/media-plane test`
- PASS: `pnpm lint`
- PASS: `pnpm typecheck`
- PASS: `pnpm test`
- PASS: `git diff --check`

## Deferred operator actions

- Confirm canonical remote and main branch synchronization.
- Verify remote tag availability before creating `v5.10.0`.
- Create and publish the release tag only after explicit authorization.
