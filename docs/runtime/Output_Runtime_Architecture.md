# UBOS v4.5 Output Runtime Architecture

The Output Runtime orchestrates destination metadata after Program, Preview, Aux, Multiview, or Clean Feed routing has already been produced by existing UBOS systems. It does not encode, stream, record, composite, capture, or create media pipelines.

## Components

- `OutputRuntimeController`: lifecycle owner and API facade for output metadata.
- `OutputRegistry`: authoritative registration index with duplicate rejection.
- `OutputLifecycleManager`: validates state transitions.
- `OutputHealthMonitor`: stores health metadata from external providers.
- `OutputMetricsCollector`: stores counters and bandwidth/latency metadata.
- `OutputRecoveryManager`: calculates restart/retry/fallback/manual/backoff metadata.
- `OutputCapabilityResolver`: creates deterministic route metadata.
- `OutputEventAdapter`: publishes `Output*` events to `RuntimeEventBus`.
- `OutputStateStore`: serializable output state store.

## Safety

All nodes are metadata-only and explicitly mark `containsMediaHandles: false` and `containsMediaPayloads: false`.
