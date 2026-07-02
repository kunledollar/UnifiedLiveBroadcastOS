# Media Execution Plane

Phase 6.1 makes the Media Execution Plane observable, configurable, and safe to operate before real media adapters are introduced.

## Runtime modes

The execution runtime supports four modes:

- `disabled`: graph transitions are accepted, intents are skipped, and no adapter is called.
- `dry_run`: graph transitions are translated into intents and logged, but no adapter is called.
- `mock_live`: intents are executed through mock adapters only.
- `live_ready`: reserved for future real adapters. Today it reports that no real adapter is active unless a future live adapter is registered.

The default is `dry_run`, which is the safest mode for development because it preserves diagnostics without simulating live media execution.

## Adapter registry

The adapter registry tracks pluggable execution adapters. Metadata includes adapter id, name, type, status, capabilities, mock/live flags, last execution timestamp, and last error. The registry can register adapters, list them, select the active adapter for the current runtime mode, enable or disable adapters, and report health metadata.

No real WebRTC, RTMP, SRT, NDI, FFmpeg, compositor, or OBS adapter is implemented in this phase.

## Execution event stream

The execution event stream is an in-memory diagnostics stream separate from Production Graph events. It records events such as intent creation, execution start/success/failure, skipped execution, adapter selection or unavailability, runtime mode changes, and dry-run records.

Every event includes an id, timestamp, graph revision, runtime mode, payload, warnings, and errors. Intent and adapter ids are included when relevant.

## Dry-run mode

Dry-run mode translates transitions into media execution intents, appends execution log entries, and emits `DRY_RUN_RECORDED` events. It never calls media adapters.

## Mock-live mode

Mock-live mode executes intents through `MockMediaExecutionAdapter`. This preserves current mock execution behavior while routing execution through the registry and event stream.

## Live-ready mode

Live-ready mode is reserved for future real adapters. Until a live adapter is registered, execution is skipped with a clear warning that no real media adapter is active. This prevents the UI or diagnostics from pretending real media is running.

## Replay diagnostics

Replay helpers list execution events and intents, replay event records, replay a specific graph revision, and summarize execution for a revision. Replay is diagnostic only: it does not mutate the Production Graph and does not call adapters.

## Mock latency simulation

`MockMediaExecutionAdapter` supports configurable deterministic latency simulation using `minLatencyMs`, `maxLatencyMs`, `failureRate`, `warningRate`, and `seed`. The deterministic seed keeps validation checks stable while allowing developers to inspect slow, warning, and failure scenarios.

## Execution health

The `MediaExecutionHealth` model reports runtime mode, active adapter, adapter count, executed/skipped/failed intent counts, average execution latency, last execution timestamp, last error, and overall health.

## Future real adapter integration

Future real adapters should register with the adapter registry using `isLive: true`, declare capabilities, and return structured adapter responses. They should not bypass runtime mode checks, execution events, health reporting, or replay-safe diagnostics.
