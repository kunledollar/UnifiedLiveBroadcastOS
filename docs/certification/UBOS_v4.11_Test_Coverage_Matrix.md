# UBOS v4.11 Test Coverage Matrix

| Subsystem | Unit tests | Integration tests | State-machine tests | Security tests | Metadata-safety tests | Lifecycle tests | Event-flow tests | Coverage gaps |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Runtime Core | Partial | Partial | Yes | Partial | Yes | Yes | Partial | No browser E2E TAKE trace. |
| Runtime Integration | Partial | Partial | Yes | Partial | Yes | Yes | Partial | Limited adapter duplication stress tests. |
| Device Platform | Partial | Partial | Yes | Partial | Yes | Yes | Partial | Physical hardware not tested. |
| Ingest Runtime | Partial | Partial | Yes | Partial | Yes | Yes | Partial | No live media ingress destructive tests. |
| Output Runtime | Partial | Partial | Yes | Partial | Yes | Yes | Partial | Live destination credentials not tested. |
| Session Runtime | Partial | Partial | Yes | Partial | Yes | Yes | Partial | Long-running soak not tested. |
| Rundown Runtime | Yes | Partial | Yes | Partial | Yes | Yes | Yes | Browser operator E2E limited. |
| Automation Runtime | Yes | Partial | Yes | Partial | Yes | Yes | Yes | Complex multi-trigger storm not exhaustively fuzzed. |
| Monitoring Runtime | Yes | Partial | Yes | Partial | Yes | Yes | Yes | API-client telemetry transport depth limited. |
| Control API | Yes | Partial | Partial | Yes | Yes | Partial | Partial | Non-destructive only; no hostile transport fuzzing. |
| Extension Registry | Yes | Partial | Yes | Yes | Yes | Yes | Partial | Real third-party plugin corpus not tested. |
| Plugin SDK | Yes | Partial | Yes | Yes | Yes | Yes | Partial | OS-level sandbox escape not applicable/claimed. |

## Validation commands executed

- `pnpm lint` — pass.
- `pnpm typecheck` — pass.
- `pnpm test` — pass; delegates to `@ubos/shared` validation suite.
- `pnpm --filter @ubos/shared test` — pass.
- `pnpm --filter @ubos/media-plane test` — pass.
- `pnpm --filter @ubos/web build` — pass with Next.js ESLint plugin warning.
- `pnpm build` — environmental failure in desktop Cargo build because `index.crates.io` DNS could not resolve.

## Evidence Reviewed

- Runtime core and integration: `packages/media-plane/src/broadcast-runtime-core.ts`.
- Production authority: `packages/shared/src/production-graph.ts`, `packages/shared/src/authority.ts`, `packages/shared/src/production-graph.validation.ts`.
- Control API: `packages/shared/src/control-api/index.ts`, `packages/shared/src/control-api/validation.ts`, `docs/api/*`.
- Plugin SDK and extension registry: `packages/shared/src/plugin-sdk/index.ts`, `packages/shared/src/plugin-sdk/validation.ts`, `docs/sdk/*`, `examples/plugins/lower-third-demo/ubos.plugin.json`.
- Domain runtimes: `packages/shared/src/*runtime*/`, `packages/media-plane/src/*runtime*`, and `docs/runtime/*`.
- UI freeze checks: `apps/web/app/control-room/*`, `packages/shared/src/workspace-manager/*`.
- Targeted searches captured raw-handle, direct-mutation, lifecycle, plugin-safety, boundedness, duplicate-owner, and shell-path evidence.
