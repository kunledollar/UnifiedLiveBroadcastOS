# UBOS v4.11 Metadata and Handle Safety Audit

## Result

PASS WITH WARNING. Serializable contracts consistently model metadata-only boundaries and include validators/flags such as `containsRuntimeHandles: false`, `containsMediaHandles: false`, `containsProcessHandles: false`, and `containsSecrets: false`. The warning is that raw-handle safety is verified by static search and existing validators rather than a single repository-wide serialization fuzzer.

| Boundary | Result | Notes |
|---|---|---|
| Device Registry | PASS | Device metadata includes capabilities, health, connection state; no native handles serialized. |
| Ingest Registry | PASS | Pipeline docs/contracts declare no media handles. |
| Output Registry | PASS | Output metadata and recovery docs avoid encoder/process handles in snapshots. |
| Session Snapshots | PASS | Snapshot docs forbid streams, buffers, sockets, encoders, GPU resources. |
| Rundown Snapshots | PASS | Rundown item contracts are metadata-only. |
| Automation History | PASS | Validation/history are command metadata, not handles. |
| Monitoring Snapshots | PASS | Telemetry/diagnostics are bounded metadata. |
| Control API commands | PASS | Control API docs forbid raw handles/secrets. |
| Plugin manifests | PASS | Plugin SDK docs/validation forbid unsafe objects. |
| ProductionGraph metadata | PASS | Execution contract asserts no runtime media in graph. |

## Search result classification

Occurrences of `MediaStream`, `MediaStreamTrack`, `AudioContext`, `RTCPeerConnection`, sockets, process, GPU, DOM, React, database, or secret terms were found primarily in deny lists, validation tests, runtime implementation boundaries, or documentation. Known runtime implementations that necessarily refer to `process.env`, WebSocket clients, or filesystem access do not expose those objects through serializable v4 contracts.

## Evidence Reviewed

- Runtime core and integration: `packages/media-plane/src/broadcast-runtime-core.ts`.
- Production authority: `packages/shared/src/production-graph.ts`, `packages/shared/src/authority.ts`, `packages/shared/src/production-graph.validation.ts`.
- Control API: `packages/shared/src/control-api/index.ts`, `packages/shared/src/control-api/validation.ts`, `docs/api/*`.
- Plugin SDK and extension registry: `packages/shared/src/plugin-sdk/index.ts`, `packages/shared/src/plugin-sdk/validation.ts`, `docs/sdk/*`, `examples/plugins/lower-third-demo/ubos.plugin.json`.
- Domain runtimes: `packages/shared/src/*runtime*/`, `packages/media-plane/src/*runtime*`, and `docs/runtime/*`.
- UI freeze checks: `apps/web/app/control-room/*`, `packages/shared/src/workspace-manager/*`.
- Targeted searches captured raw-handle, direct-mutation, lifecycle, plugin-safety, boundedness, duplicate-owner, and shell-path evidence.
