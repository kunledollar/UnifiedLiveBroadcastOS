# UBOS v4.11 State Machine Audit

| State machine | Result | Evidence / notes |
|---|---|---|
| Runtime Core | PASS | RuntimeLifecycleState/allowed transitions enforced by RuntimeController. |
| Device connections | PASS | Device/hardware lifecycles include discovered/connecting/connected/disconnected/failed. |
| Ingest pipelines | PASS | Pipeline validation/state-machine docs present. |
| Outputs | PASS | Output state machine and recovery docs present. |
| Sessions | PASS | Created/Loading/Ready/Running/Paused/Recovering/Stopping/Stopped/Archived/Disposed documented. |
| Rundowns/items | PASS | Rundown state machine, item contract, validation, recovery docs present. |
| Automations | PASS | Automation validation and state-machine docs/tests pass. |
| Alerts/incidents | PASS | Monitoring validation covers alerts/incidents. |
| API client sessions | PASS WITH WARNING | Session states present; transport integration coverage limited. |
| Plugins | PASS | Plugin SDK validation passed lifecycle checks. |

## Inconsistencies

No blocking inconsistent state naming or unreachable critical state was verified. Some domains use capitalized state names in documentation and lowercase literals in code; no functional defect was observed.

## Evidence Reviewed

- Runtime core and integration: `packages/media-plane/src/broadcast-runtime-core.ts`.
- Production authority: `packages/shared/src/production-graph.ts`, `packages/shared/src/authority.ts`, `packages/shared/src/production-graph.validation.ts`.
- Control API: `packages/shared/src/control-api/index.ts`, `packages/shared/src/control-api/validation.ts`, `docs/api/*`.
- Plugin SDK and extension registry: `packages/shared/src/plugin-sdk/index.ts`, `packages/shared/src/plugin-sdk/validation.ts`, `docs/sdk/*`, `examples/plugins/lower-third-demo/ubos.plugin.json`.
- Domain runtimes: `packages/shared/src/*runtime*/`, `packages/media-plane/src/*runtime*`, and `docs/runtime/*`.
- UI freeze checks: `apps/web/app/control-room/*`, `packages/shared/src/workspace-manager/*`.
- Targeted searches captured raw-handle, direct-mutation, lifecycle, plugin-safety, boundedness, duplicate-owner, and shell-path evidence.
