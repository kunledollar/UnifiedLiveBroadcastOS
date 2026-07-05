# UBOS Runtime Monitoring, Telemetry and System Health

## Architecture

The Phase 27 monitoring runtime lives in `packages/shared/src/runtime-monitoring` and is a deterministic, metadata-only runtime. It models monitoring sessions, queues, dispatchers, executors, history, snapshots, metrics, health checks, alerts, diagnostics, dashboards, logs and operator notifications without sockets, cloud services, native monitoring libraries, browser Performance APIs, Node performance hooks or background daemons.

## Telemetry pipeline

Operators and runtimes submit metadata commands to `MonitoringDispatcher`, which places them in `MonitoringQueue`. `MonitoringExecutor` drains the queue synchronously into `MonitoringRuntime.apply`. The runtime validates commands, rejects unsafe runtime handles, and stores serializable telemetry records.

## Health aggregation

Every UBOS subsystem has a `HealthCheck` and `HealthIndicator`: Production Engine, Execution Engine, Switcher, Graphics, GPU, Rendering, Media, Audio, Recording, Automation, AI Assistant, Distribution, Security, Devices, Guests, Replay, Outputs, Database, Workspace and Plugins. Overall health is derived by deterministic severity ranking.

## Alert lifecycle

Alert rules compare incoming metrics against thresholds. Triggered rules open active alerts and create operator notifications. Explicit recovery marks an alert as recovering. A recovery metric resolves the alert and returns the affected subsystem to healthy.

## Metric collection

Metrics are metadata samples for CPU, GPU, RAM, VRAM, frame rate, dropped frames, latency, switch latency, audio delay, video delay, network, storage, recording speed, encoder queue, decoder queue, render queue, media cache, frame cache, command queue, worker queue, temperature, bandwidth, packet loss, buffer utilization, disk usage, session count and operator count. Negative values are rejected.

## Diagnostics

`DiagnosticReport` serializes health, alerts, logs and recommendations. Reports carry `containsRuntimeHandles: false` to keep diagnostics safe to persist, replay and render in the control room.

## Performance counters

`PerformanceCounter` records deterministic counts for queues, commands and subsystem activities. Counters are metadata only and are not bound to platform timers or native resources.

## Future Prometheus integration

A future adapter may translate `MonitoringSnapshot` into Prometheus exposition data outside this runtime. The runtime intentionally does not implement exporters.

## Future OpenTelemetry integration

A future integration may map `TelemetrySnapshot`, `MonitoringEvent` and `DiagnosticReport` to OpenTelemetry spans or logs. This phase keeps the core runtime exporter-free.

## Future Grafana integration

A future dashboard service may read serialized snapshots and feed Grafana. The current control room dashboard renders directly from deterministic metadata.
