# Phase 2.23 – Diagnostics, Telemetry & Performance Profiler

Phase 2.23 adds a backend-independent diagnostics subsystem for UBOS runtime metadata. It is designed for operators, developers, future monitoring dashboards, and deterministic test fixtures without depending on operating-system profilers, browser performance APIs, native telemetry libraries, external services, or persistence.

## Deliverables

- `DiagnosticsManager` coordinates runtime metrics, tracing, event history, alerts, and snapshot export.
- `PerformanceProfiler` records metadata-only frame timing, dropped frame counts, audio latency, and render latency.
- `HealthMonitor` tracks pipeline checks and derives a worst-case pipeline health state.
- Snapshot/export APIs expose deterministic JSON-compatible metadata for tools and demos.
- `createDiagnosticsDemo()` provides a small runnable metadata scenario.

## Runtime metrics model

The snapshot contains CPU, GPU, memory, frame timing, audio latency, and render latency metadata. CPU/GPU/memory values are intentionally caller-supplied estimates so adapters can report normalized metadata without binding the core runtime to a platform API.

## Health, tracing, events, and alerts

Pipeline health is represented as named checks with `healthy`, `degraded`, `critical`, or `unknown` states. Execution traces use simple `begin`, `end`, and `instant` phases. Performance events preserve bounded operational history metadata, while alerts model warning and critical operator-visible conditions with acknowledgement support.

## Backend independence

Every diagnostics snapshot includes explicit backend flags proving that the subsystem is metadata-only and does not use OS-specific performance APIs, browser APIs, native profiler dependencies, external telemetry services, or persisted storage.

## Demo

Run the diagnostics demo after building the media plane:

```bash
pnpm diagnostics:demo
```

The demo prints summary metadata from `createDiagnosticsDemo()` including pipeline and alert counts.
