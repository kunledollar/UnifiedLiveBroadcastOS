# UBOS v5.1.7 Telemetry & Watchdog

The runtime telemetry collector is the unified metadata snapshot for lifecycle, frame-clock, scheduler, command executor, runtime loop, and tick processor state. Numeric bigint fields are serialized as decimal strings so public snapshots are JSON-safe and deterministic.

The runtime watchdog observes telemetry and subsystem snapshots without mutating subsystem internals. It evaluates health precedence, opens deterministic incidents for failed runtime state, stale telemetry, and critical overload, supports acknowledgement and resolution, and keeps incident, diagnostic, and recovery histories bounded.

Diagnostics are metadata-only. Keys that may contain credentials, tokens, authorization values, cookies, stream keys, command payloads, processor state, or other secrets are redacted before being retained.
