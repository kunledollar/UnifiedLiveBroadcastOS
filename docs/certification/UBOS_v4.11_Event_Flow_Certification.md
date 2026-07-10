# UBOS v4.11 Event Flow Certification

| Trace | Required path | Result | Evidence |
|---|---|---|---|
| A. Operator TAKE | Operator → Command Center → ProductionGraph authorization → RuntimeController → RuntimeEventBus → adapters → Monitoring → UI | PASS WITH WARNING | ProductionGraph command/revision tests pass; UI integration is indirectly verified by web build, not an end-to-end browser test. |
| B. External production command | Control API client → session → schema → auth → rate → idempotency → ProductionGraph → audit → monitoring → response | PASS WITH WARNING | Control API validation passes; transport-specific stale-session enforcement is documented but not exhaustively integration-tested. |
| C. Device disconnect | Provider → DeviceManager → RuntimeEventBus → Ingest → HealthManager → Monitoring → alert/UI/API | PASS | Device runtime emits events; HealthManager publishes health changes; monitoring validation passes. |
| D. Output failure | Output Runtime → RuntimeEventBus → HealthManager → Monitoring → alert rule → incident → operator metadata | PASS | Output and monitoring docs/validations cover failure and incident state. |
| E. Rundown automation | Rundown → Automation → validation → ProductionGraph authorization → RuntimeEventBus → history → monitoring | PASS | Rundown/automation validation commands passed. |

## Ordering and IDs

- RuntimeEventBus assigns monotonically increasing sequence numbers, providing deterministic in-process publication ordering.
- Control commands and events carry correlation IDs; causation IDs are included where supported by command/audit models.
- No recursive event loop was verified in tests or targeted searches.
- No duplicate publication defect was verified.

## Evidence Reviewed

- Runtime core and integration: `packages/media-plane/src/broadcast-runtime-core.ts`.
- Production authority: `packages/shared/src/production-graph.ts`, `packages/shared/src/authority.ts`, `packages/shared/src/production-graph.validation.ts`.
- Control API: `packages/shared/src/control-api/index.ts`, `packages/shared/src/control-api/validation.ts`, `docs/api/*`.
- Plugin SDK and extension registry: `packages/shared/src/plugin-sdk/index.ts`, `packages/shared/src/plugin-sdk/validation.ts`, `docs/sdk/*`, `examples/plugins/lower-third-demo/ubos.plugin.json`.
- Domain runtimes: `packages/shared/src/*runtime*/`, `packages/media-plane/src/*runtime*`, and `docs/runtime/*`.
- UI freeze checks: `apps/web/app/control-room/*`, `packages/shared/src/workspace-manager/*`.
- Targeted searches captured raw-handle, direct-mutation, lifecycle, plugin-safety, boundedness, duplicate-owner, and shell-path evidence.
