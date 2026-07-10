# UBOS v4.12 Baseline Manifest

- Release identity: UBOS v4.12.0 — Platform Architecture Baseline
- Release commit hash at audit start: d44729b3c0a5a4eb932199dd68c0ec018c6be386
- Working branch at audit start: work
- Tag: v4.12.0 (planned, not created by agent)
- Root package version: 1.0.0-rc.1
- Package manager: pnpm@10.28.1
- Node version: v24.15.0
- pnpm version: 10.28.1
- Cargo version: cargo 1.95.0 (f2d3ce0bd 2026-03-21)
- Rust version: rustc 1.95.0 (59807616e 2026-04-14)
- Operating system: Linux b80f1d809314 6.12.47 x86_64 GNU/Linux

## Validation commands and results

| Command | Result |
| --- | --- |
| git status | Clean on branch work before docs changes. |
| git branch --show-current | work. |
| git remote -v | No remote configured in this container. |
| git fetch --all --prune | No remote to fetch. |
| git log --oneline --decorate -20 | Shows merged v4.3 through v4.11 PR history ending at d44729b. |
| git rev-parse main | Failed: local main absent. |
| git rev-parse origin/main | Failed: origin/main absent. |
| git branch -r --no-merged origin/main | Failed: origin/main absent. |
| git branch --no-merged main | Failed: main absent. |
| pnpm lint | PASS. |
| pnpm typecheck | PASS. |
| pnpm test | PASS. |
| pnpm --filter @ubos/shared test | PASS. |
| pnpm --filter @ubos/media-plane test | PASS. |
| pnpm --filter @ubos/web build | PASS with non-blocking Next.js ESLint-plugin warning. |
| pnpm build | FAIL, environmental DNS failure resolving index.crates.io during desktop Cargo build. |

## Subsystem list

Workspace Manager, Command Center Shell, Program Monitor, Preview Monitor, ProductionGraph, RuntimeController, RuntimeEventBus, DeviceManager, IngestRuntimeController, OutputRuntimeController, SessionRuntimeController, RundownRuntimeController, AutomationRuntimeController, MonitoringRuntimeController, ControlApiGateway, ExtensionRegistry, Plugin SDK, Media Plane, recording, streaming, replay, graphics, audio, FFmpeg adapters, and GPU compositor.

## Public package exports

- `packages/shared/src/index.ts` remains the shared package barrel.
- `packages/media-plane/src/index.ts` exports ingest, output, session, and rundown runtime modules and media-plane planning APIs.
- Domain package barrels under `packages/shared/src/*/index.ts` expose runtime validation and SDK/API surfaces.

## Known issues

See `docs/releases/UBOS_v4.12_Platform_Baseline.md` and `docs/reports/UBOS_v4.12_Platform_Freeze_and_Baseline.md`.

## Documentation inventory

Certification documents under `docs/certification`, runtime architecture documents under `docs/runtime`, API documents under `docs/api`, SDK documents under `docs/sdk`, v4 reports under `docs/reports`, and this v4.12 release set under `docs/releases`.

## Report inventory

Existing reports cover v4.3 through v4.11, plus this v4.12 final freeze report.

## Test inventory

Targeted validations include production graph, runtime switching, media, audio, WebRTC, recording, security, monitoring, cluster, plugin SDK, cloud, AI director, analytics, enterprise admin, desktop platform, collaboration foundation, automation, release engineering, broadcast I/O, workspace manager, rundown runtime, automation runtime, control API, media-plane validation, and transport validation.

## Checksum strategy

For release artifacts, generate SHA-256 checksums after final operator build:

```bash
find dist apps packages release docs/releases -type f -print0 | sort -z | xargs -0 sha256sum > release/ubos-v4.12.0-sha256sums.txt
```
