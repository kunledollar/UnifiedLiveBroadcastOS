# UBOS v4.11 Architecture Ownership Matrix

| Responsibility | Authoritative owner | Evidence | Certification | Notes |
|---|---|---|---|---|
| Workspace layout and geometry | Workspace Manager | `packages/shared/src/workspace-manager/*`, workspace validation test | PASS | No runtime ownership found. |
| Active Control Room shell | Command Center Shell | `apps/web/app/control-room/command-center/*`, `/control-room` route | PASS WITH WARNING | Additional diagnostic pages exist under `/control-room/*`; they are not alternate full shells. |
| Production metadata, revisioning, routing, production commands | ProductionGraph | `production-graph.ts`, `authority.ts` | PASS | Expected revision checks and authority arbitration present. |
| Global lifecycle | RuntimeController | `broadcast-runtime-core.ts` | PASS | Registers subsystems, validates dependency DAG, sequences lifecycle. |
| Cross-runtime metadata events | RuntimeEventBus | `broadcast-runtime-core.ts` | PASS WITH WARNING | Ordering deterministic by sequence; replay array is not bounded in core event bus. |
| Device lifecycle | DeviceManager / Device Runtime | `broadcast-runtime-core.ts`, `device-platform.ts`, runtime docs | PASS | Metadata-only discovery/connection model. |
| Ingest pipeline lifecycle | IngestRuntimeController | `ingest-runtime.ts`, docs/runtime/Ingest_Runtime_Architecture.md | PASS | Metadata-only pipeline registry. |
| Output lifecycle | OutputRuntimeController | `output-runtime.ts`, runtime docs | PASS | Output registry and recovery documented. |
| Session lifecycle | SessionRuntimeController | `session-runtime.ts`, docs/runtime/Session_State_Machine.md | PASS | Snapshots metadata-only. |
| Rundown lifecycle | RundownRuntimeController | `rundown-runtime/*`, docs/runtime/Rundown_* | PASS | Advancement authorized through production command contracts. |
| Automation lifecycle | AutomationRuntimeController | `automation-runtime/*`, docs/runtime/Automation_* | PASS | Validation present; monitoring history bounded by docs/tests. |
| Observability | MonitoringRuntimeController | `runtime-monitoring/*`, docs/runtime/Monitoring_* | PASS | Health, alerts, incidents, snapshots covered. |
| External command/query entry | ControlApiGateway | `control-api/index.ts` | PASS WITH WARNING | Authorization/rate/idempotency present; client-session enforcement is modelled but not transport-exhaustively verified. |
| Extension metadata and plugin registration | ExtensionRegistry | `plugin-sdk/index.ts` | PASS | Unique IDs, manifests, namespaces, dependency cycles tested. |
| Media processing | Media Plane | `packages/media-plane/src/*` | PASS | Metadata adapters keep serializable boundaries free of raw handles. |

## Findings

- No critical duplicate owner was verified.
- No orphaned v4 responsibility was identified in the frozen systems.
- No active legacy owner was verified as authoritative.
- Bypass-risk review found the expected integration seams; certification warnings are recorded for bounded core event replay and limited end-to-end transport security coverage.

## Evidence Reviewed

- Runtime core and integration: `packages/media-plane/src/broadcast-runtime-core.ts`.
- Production authority: `packages/shared/src/production-graph.ts`, `packages/shared/src/authority.ts`, `packages/shared/src/production-graph.validation.ts`.
- Control API: `packages/shared/src/control-api/index.ts`, `packages/shared/src/control-api/validation.ts`, `docs/api/*`.
- Plugin SDK and extension registry: `packages/shared/src/plugin-sdk/index.ts`, `packages/shared/src/plugin-sdk/validation.ts`, `docs/sdk/*`, `examples/plugins/lower-third-demo/ubos.plugin.json`.
- Domain runtimes: `packages/shared/src/*runtime*/`, `packages/media-plane/src/*runtime*`, and `docs/runtime/*`.
- UI freeze checks: `apps/web/app/control-room/*`, `packages/shared/src/workspace-manager/*`.
- Targeted searches captured raw-handle, direct-mutation, lifecycle, plugin-safety, boundedness, duplicate-owner, and shell-path evidence.
