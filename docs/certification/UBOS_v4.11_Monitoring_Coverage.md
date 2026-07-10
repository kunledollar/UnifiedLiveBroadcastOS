# UBOS v4.11 Monitoring Coverage

| Source | Coverage result | Notes |
|---|---|---|
| Runtime Core | PASS | Runtime controller publishes scheduled/completed lifecycle events and HealthManager state. |
| Devices | PASS | Device manager publishes discovery and health metadata. |
| Ingest | PASS | Pipeline health/metrics documented. |
| Outputs | PASS | Output metrics, state, recovery docs. |
| Sessions | PASS | Session snapshots/recovery docs. |
| Rundowns | PASS | Rundown event flow/history docs. |
| Automation | PASS | Automation scheduler/triggers/recovery docs. |
| ProductionGraph | PASS | Telemetry adapter documented; authority checks validated. |
| Plugins | PASS | Plugin health docs/contracts. |
| API clients | PASS WITH WARNING | Audit/session metadata exists; transport-level telemetry not exhaustively simulated. |
| Media adapters | PASS | Media-plane validation and runtime metrics are metadata-only. |

## Monitoring behaviors

Stale-data detection, aggregation, warning/critical propagation, unavailable-vs-error distinction, alert deduplication, debounce/cooldown/suppression/acknowledgement/resolution, incident grouping, diagnostic snapshots, and bounded history are documented in v4.9 monitoring docs and covered by `runtime-monitoring validation passed`.

## Evidence Reviewed

- Runtime core and integration: `packages/media-plane/src/broadcast-runtime-core.ts`.
- Production authority: `packages/shared/src/production-graph.ts`, `packages/shared/src/authority.ts`, `packages/shared/src/production-graph.validation.ts`.
- Control API: `packages/shared/src/control-api/index.ts`, `packages/shared/src/control-api/validation.ts`, `docs/api/*`.
- Plugin SDK and extension registry: `packages/shared/src/plugin-sdk/index.ts`, `packages/shared/src/plugin-sdk/validation.ts`, `docs/sdk/*`, `examples/plugins/lower-third-demo/ubos.plugin.json`.
- Domain runtimes: `packages/shared/src/*runtime*/`, `packages/media-plane/src/*runtime*`, and `docs/runtime/*`.
- UI freeze checks: `apps/web/app/control-room/*`, `packages/shared/src/workspace-manager/*`.
- Targeted searches captured raw-handle, direct-mutation, lifecycle, plugin-safety, boundedness, duplicate-owner, and shell-path evidence.
